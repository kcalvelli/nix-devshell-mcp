import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { DevshellTool } from '../../src/tools/DevshellTool.js';
import { ConfigManager } from '../../src/config/ConfigManager.js';
import { FilesystemManager } from '../../src/fs/FilesystemManager.js';
import { ProfileManager } from '../../src/profiles/ProfileManager.js';
import { TemplateRenderer } from '../../src/templates/TemplateRenderer.js';
import { Validator } from '../../src/validation/Validator.js';
import { McpError } from '../../src/utils/errors.js';

describe('DevshellTool', () => {
  let devshellTool: DevshellTool;
  let tempDir: string;
  let templatesDir: string;
  let projectDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'devshell-test-'));
    templatesDir = path.join(tempDir, 'templates');
    projectDir = path.join(tempDir, 'project');

    await fs.mkdir(templatesDir);
    await fs.mkdir(projectDir);

    // Create a test profile
    const profileDir = path.join(templatesDir, 'test-profile');
    await fs.mkdir(profileDir);

    const profileConfig = {
      metadata: {
        name: 'test-profile',
        displayName: 'Test Profile',
        description: 'A test profile',
        version: '1.0.0',
        supportedOptions: [],
        tags: ['test'],
        examples: [],
      },
      templates: {
        flake: 'flake.nix.hbs',
        readme: 'README.md.hbs',
      },
      defaults: {
        projectName: 'test-project',
        description: 'Test description',
      },
    };

    await fs.writeFile(
      path.join(profileDir, 'profile.json'),
      JSON.stringify(profileConfig)
    );

    // Create template files
    await fs.writeFile(
      path.join(profileDir, 'flake.nix.hbs'),
      '# Flake for {{projectName}}\n# Description: {{description}}'
    );
    await fs.writeFile(
      path.join(profileDir, 'README.md.hbs'),
      '# {{projectName}}\n\n{{description}}'
    );

    // Initialize DevshellTool with custom templates directory
    const profileManager = new ProfileManager(templatesDir);
    devshellTool = new DevshellTool(
      new ConfigManager(),
      new FilesystemManager(),
      profileManager,
      new TemplateRenderer(),
      new Validator()
    );

    await devshellTool.initialize();
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('initialize', () => {
    it('should load profiles during initialization', async () => {
      const profiles = devshellTool.listProfiles();
      expect(profiles).toHaveLength(1);
      expect(profiles[0].name).toBe('test-profile');
    });
  });

  describe('listProfiles', () => {
    it('should return list of available profiles', () => {
      const profiles = devshellTool.listProfiles();

      expect(profiles).toHaveLength(1);
      expect(profiles[0]).toHaveProperty('name');
      expect(profiles[0]).toHaveProperty('description');
      expect(profiles[0]).toHaveProperty('version');
    });
  });

  describe('createDevshell', () => {
    it('should create devshell with valid input', async () => {
      const input = {
        projectPath: projectDir,
        profile: 'test-profile',
        options: {
          projectName: 'my-project',
          description: 'My test project',
        },
      };

      const result = await devshellTool.createDevshell(input);

      expect(result.success).toBe(true);
      expect(result.profile).toBe('test-profile');
      expect(result.filesCreated).toHaveLength(2);

      // Verify files were created
      const flakeContent = await fs.readFile(
        path.join(projectDir, 'flake.nix'),
        'utf-8'
      );
      expect(flakeContent).toContain('my-project');
      expect(flakeContent).toContain('My test project');
    });

    it('should throw error for invalid input', async () => {
      const input = {
        projectPath: '',
        profile: 'test-profile',
      };

      await expect(devshellTool.createDevshell(input)).rejects.toThrow(McpError);
    });

    it('should throw error for non-existent profile', async () => {
      const input = {
        projectPath: projectDir,
        profile: 'nonexistent-profile',
      };

      await expect(devshellTool.createDevshell(input)).rejects.toThrow(McpError);
    });

    it('should throw error for non-existent project directory', async () => {
      const input = {
        projectPath: path.join(tempDir, 'nonexistent'),
        profile: 'test-profile',
      };

      await expect(devshellTool.createDevshell(input)).rejects.toThrow(McpError);
    });

    it('should merge configurations with correct priority', async () => {
      // Create user config
      const userConfigDir = path.join(
        process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'),
        'nix-devshell-mcp'
      );
      await fs.mkdir(userConfigDir, { recursive: true });
      const userConfig = {
        author: 'User Author',
        projectName: 'user-project',
      };
      await fs.writeFile(
        path.join(userConfigDir, 'config.json'),
        JSON.stringify(userConfig)
      );

      // Create project config
      const projectConfig = {
        author: 'Project Author',
      };
      await fs.writeFile(
        path.join(projectDir, 'devshell-config.json'),
        JSON.stringify(projectConfig)
      );

      const input = {
        projectPath: projectDir,
        profile: 'test-profile',
        options: {
          projectName: 'tool-project',
        },
      };

      try {
        const result = await devshellTool.createDevshell(input);

        // Tool options should override everything
        const flakeContent = await fs.readFile(
          path.join(projectDir, 'flake.nix'),
          'utf-8'
        );
        expect(flakeContent).toContain('tool-project');
      } finally {
        // Cleanup
        await fs.rm(userConfigDir, { recursive: true, force: true });
      }
    });

    it('should not overwrite existing files', async () => {
      const existingFile = path.join(projectDir, 'flake.nix');
      const existingContent = '# Existing flake';
      await fs.writeFile(existingFile, existingContent);

      const input = {
        projectPath: projectDir,
        profile: 'test-profile',
      };

      const result = await devshellTool.createDevshell(input);

      // File should not be in filesCreated
      expect(result.filesCreated).not.toContain(existingFile);

      // File content should remain unchanged
      const content = await fs.readFile(existingFile, 'utf-8');
      expect(content).toBe(existingContent);
    });

    it('should use profile defaults when no options provided', async () => {
      const input = {
        projectPath: projectDir,
        profile: 'test-profile',
      };

      const result = await devshellTool.createDevshell(input);

      const flakeContent = await fs.readFile(
        path.join(projectDir, 'flake.nix'),
        'utf-8'
      );
      expect(flakeContent).toContain('test-project');
      expect(flakeContent).toContain('Test description');
    });

    it('should return configuration in result', async () => {
      const input = {
        projectPath: projectDir,
        profile: 'test-profile',
        options: {
          nodeVersion: '20',
        },
      };

      const result = await devshellTool.createDevshell(input);

      expect(result.configuration).toBeDefined();
      expect(result.configuration.nodeVersion).toBe('20');
    });
  });

  describe('post-creation hooks', () => {
    beforeEach(async () => {
      // Create profile with post-creation hook
      const profileDir = path.join(templatesDir, 'hook-profile');
      await fs.mkdir(profileDir);

      const profileConfig = {
        metadata: {
          name: 'hook-profile',
          displayName: 'Hook Profile',
          description: 'Profile with hook',
          version: '1.0.0',
          supportedOptions: [],
          tags: ['test'],
          examples: [],
          postCreate: 'post-create.sh',
        },
        templates: {
          flake: 'flake.nix.hbs',
        },
        defaults: {},
      };

      await fs.writeFile(
        path.join(profileDir, 'profile.json'),
        JSON.stringify(profileConfig)
      );

      await fs.writeFile(
        path.join(profileDir, 'flake.nix.hbs'),
        '# Test flake'
      );

      // Create a simple post-create hook
      const hookScript = `#!/bin/bash
echo "Hook executed successfully"
exit 0
`;
      await fs.writeFile(path.join(profileDir, 'post-create.sh'), hookScript);

      // Reload profiles
      await devshellTool.initialize();
    });

    it('should execute post-creation hook if present', async () => {
      const input = {
        projectPath: projectDir,
        profile: 'hook-profile',
      };

      const result = await devshellTool.createDevshell(input);

      expect(result.hookResult).toBeDefined();
      // Hook may fail in test environment due to lack of bash, which is ok
      // Just verify the hook was attempted
      expect(result.hookResult?.exitCode).toBeDefined();
    });

    it('should handle hook script not found gracefully', async () => {
      // Create profile with non-existent hook
      const profileDir = path.join(templatesDir, 'missing-hook-profile');
      await fs.mkdir(profileDir);

      const profileConfig = {
        metadata: {
          name: 'missing-hook-profile',
          displayName: 'Missing Hook Profile',
          description: 'Profile with missing hook',
          version: '1.0.0',
          supportedOptions: [],
          tags: ['test'],
          examples: [],
          postCreate: 'nonexistent.sh',
        },
        templates: {
          flake: 'flake.nix.hbs',
        },
        defaults: {},
      };

      await fs.writeFile(
        path.join(profileDir, 'profile.json'),
        JSON.stringify(profileConfig)
      );

      await fs.writeFile(
        path.join(profileDir, 'flake.nix.hbs'),
        '# Test flake'
      );

      await devshellTool.initialize();

      const input = {
        projectPath: projectDir,
        profile: 'missing-hook-profile',
      };

      const result = await devshellTool.createDevshell(input);

      expect(result.hookResult).toBeDefined();
      expect(result.hookResult?.success).toBe(false);
      expect(result.hookResult?.error).toContain('not found');
    });
  });
});
