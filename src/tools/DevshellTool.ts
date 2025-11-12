import * as path from 'path';
import * as fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ConfigManager } from '../config/ConfigManager.js';
import { FilesystemManager } from '../fs/FilesystemManager.js';
import { ProfileManager } from '../profiles/ProfileManager.js';
import { TemplateRenderer } from '../templates/TemplateRenderer.js';
import { Validator } from '../validation/Validator.js';
import { ErrorCode, McpError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import type {
  CreateDevshellInput,
  CreateDevshellOutput,
  RenderContext,
  ExecutionResult,
} from '../types.js';

const execAsync = promisify(exec);

export class DevshellTool {
  private configManager: ConfigManager;
  private filesystemManager: FilesystemManager;
  private profileManager: ProfileManager;
  private templateRenderer: TemplateRenderer;
  private validator: Validator;

  constructor(
    configManager?: ConfigManager,
    filesystemManager?: FilesystemManager,
    profileManager?: ProfileManager,
    templateRenderer?: TemplateRenderer,
    validator?: Validator,
  ) {
    this.configManager = configManager || new ConfigManager();
    this.filesystemManager = filesystemManager || new FilesystemManager();
    this.profileManager = profileManager || new ProfileManager();
    this.templateRenderer = templateRenderer || new TemplateRenderer();
    this.validator = validator || new Validator();
  }

  async initialize(): Promise<void> {
    logger.info('Initializing DevshellTool...');
    await this.profileManager.loadProfiles();
    logger.info(`Loaded ${this.profileManager.getProfileCount()} profiles`);
  }

  async createDevshell(input: CreateDevshellInput): Promise<CreateDevshellOutput> {
    logger.info(`Creating devshell for profile: ${input.profile}`);

    // Step 1: Validate input
    this.validator.validateToolInput(input);
    this.validator.validatePath(input.projectPath);

    // Step 2: Check if project directory exists
    try {
      await fs.access(input.projectPath);
    } catch {
      throw new McpError(
        ErrorCode.DIRECTORY_NOT_FOUND,
        `Project directory not found: ${input.projectPath}`,
        { projectPath: input.projectPath },
      );
    }

    // Step 3: Load configurations
    const userConfig = await this.configManager.loadUserConfig();
    const projectConfig = await this.configManager.loadProjectConfig(input.projectPath);

    // Step 4: Get profile
    const profile = this.profileManager.getProfile(input.profile);

    // Step 5: Merge configurations
    const mergedConfig = this.configManager.mergeConfigs(
      userConfig,
      projectConfig,
      input.options || {},
      profile.defaults,
    );

    // Step 6: Validate merged configuration
    await this.configManager.validateConfig(mergedConfig);

    // Step 7: Validate profile options
    this.validator.validateProfileOptions(mergedConfig, profile.metadata.schema);

    // Step 8: Build render context
    const context: RenderContext = {
      profile: profile.metadata.name,
      projectPath: input.projectPath,
      projectName: (mergedConfig.projectName as string) || path.basename(input.projectPath),
      ...mergedConfig,
    };

    // Step 9: Render and write files
    const filesCreated = await this.generateFiles(
      profile.templates as Record<string, unknown>,
      context,
      input.projectPath,
    );

    // Step 10: Execute post-creation hooks
    let hookResult: ExecutionResult | undefined;
    if (profile.metadata.postCreate) {
      hookResult = await this.executePostCreateHook(
        profile.metadata.postCreate,
        input.projectPath,
        context,
      );
    }

    logger.info(`Devshell creation completed: ${filesCreated.length} files created`);

    return {
      success: true,
      filesCreated,
      profile: profile.metadata.name,
      configuration: mergedConfig,
      hookResult,
    };
  }

  private async generateFiles(
    templates: Record<string, unknown>,
    context: RenderContext,
    projectPath: string,
  ): Promise<string[]> {
    const filesCreated: string[] = [];
    const profilePath = path.join(
      this.profileManager.getTemplatesDirectory(),
      context.profile,
    );

    const processTemplate = async (key: string, value: unknown): Promise<void> => {
      if (typeof value === 'string') {
        // Single template file
        const templatePath = path.join(profilePath, value);
        const outputPath = path.join(projectPath, value.replace('.hbs', ''));

        // Validate paths
        this.filesystemManager.validatePath(projectPath, outputPath);

        // Render template
        const content = await this.templateRenderer.renderTemplate(templatePath, context);

        // Write file (non-destructive)
        const result = await this.filesystemManager.safeWrite(outputPath, content, {
          skipIfExists: true,
        });

        if (result.written) {
          filesCreated.push(outputPath);
          logger.debug(`Created file: ${outputPath}`);
        } else {
          logger.debug(`Skipped existing file: ${outputPath}`);
        }
      } else if (Array.isArray(value)) {
        // Array of template files
        for (const item of value) {
          await processTemplate(key, item);
        }
      } else if (typeof value === 'object' && value !== null) {
        // Nested template structure
        for (const [subKey, subValue] of Object.entries(value)) {
          await processTemplate(`${key}.${subKey}`, subValue);
        }
      }
    };

    // Process all templates
    for (const [key, value] of Object.entries(templates)) {
      await processTemplate(key, value);
    }

    return filesCreated;
  }

  private async executePostCreateHook(
    hookScript: string,
    projectPath: string,
    context: RenderContext,
  ): Promise<ExecutionResult> {
    logger.info('Executing post-creation hook...');

    try {
      const profilePath = path.join(
        this.profileManager.getTemplatesDirectory(),
        context.profile,
      );
      const hookPath = path.join(profilePath, hookScript);

      // Check if hook script exists
      try {
        await fs.access(hookPath);
      } catch {
        logger.warn(`Post-creation hook not found: ${hookPath}`);
        return {
          success: false,
          exitCode: -1,
          error: 'Hook script not found',
        };
      }

      // Make hook executable
      await this.filesystemManager.makeExecutable(hookPath);

      // Execute hook with timeout
      const hookTimeout = 30000; // 30 seconds
      const { stdout, stderr } = await execAsync(`"${hookPath}"`, {
        cwd: projectPath,
        timeout: hookTimeout,
        env: {
          ...process.env,
          PROJECT_PATH: projectPath,
          PROJECT_NAME: context.projectName,
          PROFILE: context.profile,
        },
      });

      logger.info('Post-creation hook completed successfully');
      return {
        success: true,
        exitCode: 0,
        stdout: stdout?.trim() || '',
        stderr: stderr?.trim() || '',
      };
    } catch (error: unknown) {
      const err = error as Error & { code?: string; stdout?: string; stderr?: string };

      if (err.code === 'ETIMEDOUT') {
        logger.error('Post-creation hook timed out');
        throw new McpError(
          ErrorCode.HOOK_TIMEOUT,
          'Post-creation hook timed out',
          { hookScript, projectPath },
        );
      }

      logger.error(`Post-creation hook failed: ${err.message}`);
      return {
        success: false,
        exitCode: 1,
        stdout: err.stdout?.trim() || '',
        stderr: err.stderr?.trim() || '',
        error: err.message,
      };
    }
  }

  listProfiles() {
    return this.profileManager.listProfiles();
  }
}
