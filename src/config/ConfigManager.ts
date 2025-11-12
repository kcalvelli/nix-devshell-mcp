import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { ErrorCode, McpError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import type { UserConfig, ProjectConfig, MergedConfig } from '../types.js';

export class ConfigManager {
  async loadUserConfig(): Promise<UserConfig | null> {
    try {
      const configPath = this.getUserConfigPath();
      const content = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(content) as UserConfig;
      logger.debug('User config loaded');
      return this.resolveEnvVars(config);
    } catch (error: unknown) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') {
        logger.debug('No user config found');
        return null;
      }
      throw new McpError(
        ErrorCode.INVALID_CONFIG,
        `Failed to load user config: ${err.message}`,
        { path: this.getUserConfigPath() },
      );
    }
  }

  async loadProjectConfig(projectPath: string): Promise<ProjectConfig | null> {
    try {
      const configPath = path.join(projectPath, 'devshell-config.json');
      const content = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(content) as ProjectConfig;
      logger.debug('Project config loaded');
      return this.resolveEnvVars(config);
    } catch (error: unknown) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') {
        logger.debug('No project config found');
        return null;
      }
      throw new McpError(
        ErrorCode.INVALID_CONFIG,
        `Failed to load project config: ${err.message}`,
        { path: path.join(projectPath, 'devshell-config.json') },
      );
    }
  }

  mergeConfigs(
    userConfig: UserConfig | null,
    projectConfig: ProjectConfig | null,
    toolOptions: Record<string, unknown>,
    profileDefaults: Record<string, unknown>,
  ): MergedConfig {
    // Start with empty config
    let result: MergedConfig = {};

    // Merge in order: profile defaults, user config, project config, tool options
    result = this.deepMerge(result, profileDefaults);
    if (userConfig) {
      result = this.deepMerge(result, userConfig);
    }
    if (projectConfig) {
      result = this.deepMerge(result, projectConfig);
    }
    result = this.deepMerge(result, toolOptions);

    return result;
  }

  private deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
    const result = { ...target };

    for (const [key, value] of Object.entries(source)) {
      // Skip null/undefined
      if (value === null || value === undefined) {
        continue;
      }

      // Arrays: replace completely
      if (Array.isArray(value)) {
        result[key] = [...value];
        continue;
      }

      // Objects: deep merge
      if (typeof value === 'object' && !Array.isArray(value)) {
        const targetValue = result[key];
        if (typeof targetValue === 'object' && targetValue !== null && !Array.isArray(targetValue)) {
          result[key] = this.deepMerge(
            targetValue as Record<string, unknown>,
            value as Record<string, unknown>,
          );
        } else {
          result[key] = this.deepMerge({}, value as Record<string, unknown>);
        }
        continue;
      }

      // Primitives: override
      result[key] = value;
    }

    return result;
  }

  private resolveEnvVars<T>(config: T): T {
    const envVarPattern = /\$\{([^}]+)\}/g;

    const resolve = (value: unknown): unknown => {
      if (typeof value === 'string') {
        return value.replace(envVarPattern, (match, varName) => {
          const envValue = process.env[varName];
          if (envValue === undefined) {
            logger.warn(`Environment variable ${varName} not found, using placeholder`);
            return match;
          }
          return envValue;
        });
      }

      if (Array.isArray(value)) {
        return value.map(resolve);
      }

      if (typeof value === 'object' && value !== null) {
        const result: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(value)) {
          result[key] = resolve(val);
        }
        return result;
      }

      return value;
    };

    return resolve(config) as T;
  }

  private getUserConfigPath(): string {
    const configHome = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
    return path.join(configHome, 'nix-devshell-mcp', 'config.json');
  }

  async validateConfig(config: unknown): Promise<void> {
    // Basic validation - full JSON schema validation will be added with Validator
    if (typeof config !== 'object' || config === null) {
      throw new McpError(ErrorCode.INVALID_CONFIG, 'Configuration must be an object');
    }

    const cfg = config as Record<string, unknown>;

    // Validate email format if provided
    if (cfg.email && typeof cfg.email === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cfg.email)) {
        throw new McpError(ErrorCode.INVALID_CONFIG, 'Invalid email format', { email: cfg.email });
      }
    }

    logger.debug('Config validation passed');
  }
}
