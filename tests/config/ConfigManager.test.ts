import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { ConfigManager } from '../../src/config/ConfigManager.js';
import { McpError, ErrorCode } from '../../src/utils/errors.js';

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  let tempDir: string;

  beforeEach(async () => {
    configManager = new ConfigManager();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'config-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('loadUserConfig', () => {
    it('should return null when user config does not exist', async () => {
      const result = await configManager.loadUserConfig();
      expect(result).toBeNull();
    });

    it('should throw McpError on invalid JSON', async () => {
      const configPath = path.join(
        process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'),
        'nix-devshell-mcp',
        'config.json'
      );

      // Create directory
      await fs.mkdir(path.dirname(configPath), { recursive: true });

      // Write invalid JSON
      await fs.writeFile(configPath, 'invalid json');

      try {
        await expect(configManager.loadUserConfig()).rejects.toThrow(McpError);
      } finally {
        // Cleanup
        await fs.rm(path.dirname(configPath), { recursive: true, force: true });
      }
    });
  });

  describe('loadProjectConfig', () => {
    it('should return null when project config does not exist', async () => {
      const result = await configManager.loadProjectConfig(tempDir);
      expect(result).toBeNull();
    });

    it('should load valid project config', async () => {
      const configPath = path.join(tempDir, 'devshell-config.json');
      const config = {
        author: 'Test Author',
        email: 'test@example.com',
      };

      await fs.writeFile(configPath, JSON.stringify(config));

      const result = await configManager.loadProjectConfig(tempDir);
      expect(result).toEqual(config);
    });

    it('should resolve environment variables in config', async () => {
      const configPath = path.join(tempDir, 'devshell-config.json');
      const testValue = 'test-value-123';
      process.env.TEST_VAR = testValue;

      const config = {
        author: '${TEST_VAR}',
      };

      await fs.writeFile(configPath, JSON.stringify(config));

      const result = await configManager.loadProjectConfig(tempDir);
      expect(result?.author).toBe(testValue);

      delete process.env.TEST_VAR;
    });
  });

  describe('mergeConfigs', () => {
    it('should merge configs with correct priority', () => {
      const profileDefaults = { nodeVersion: '18', packageManager: 'npm' };
      const userConfig = { nodeVersion: '20', author: 'User' };
      const projectConfig = { packageManager: 'yarn', email: 'project@example.com' };
      const toolOptions = { nodeVersion: '21' };

      const result = configManager.mergeConfigs(
        userConfig,
        projectConfig,
        toolOptions,
        profileDefaults
      );

      expect(result.nodeVersion).toBe('21'); // tool options override
      expect(result.packageManager).toBe('yarn'); // project config overrides user
      expect(result.author).toBe('User'); // from user config
      expect(result.email).toBe('project@example.com'); // from project config
    });

    it('should handle null configs', () => {
      const result = configManager.mergeConfigs(null, null, {}, {});
      expect(result).toEqual({});
    });

    it('should deep merge nested objects', () => {
      const base = { defaults: { nodeVersion: '18', pythonVersion: '3.10' } };
      const override = { defaults: { nodeVersion: '20' } };

      const result = configManager.mergeConfigs(base, override, {}, {});

      expect(result.defaults).toEqual({
        nodeVersion: '20',
        pythonVersion: '3.10',
      });
    });

    it('should replace arrays instead of merging', () => {
      const base = { tags: ['tag1', 'tag2'] };
      const override = { tags: ['tag3'] };

      const result = configManager.mergeConfigs(base, override, {}, {});

      expect(result.tags).toEqual(['tag3']);
    });
  });

  describe('validateConfig', () => {
    it('should accept valid config', async () => {
      const config = {
        email: 'valid@example.com',
        author: 'Test Author',
      };

      await expect(configManager.validateConfig(config)).resolves.not.toThrow();
    });

    it('should reject non-object config', async () => {
      await expect(configManager.validateConfig('not an object')).rejects.toThrow(McpError);
      await expect(configManager.validateConfig(null)).rejects.toThrow(McpError);
    });

    it('should reject invalid email format', async () => {
      const config = { email: 'invalid-email' };

      await expect(configManager.validateConfig(config)).rejects.toThrow(McpError);
    });

    it('should accept valid email format', async () => {
      const config = { email: 'valid@example.com' };

      await expect(configManager.validateConfig(config)).resolves.not.toThrow();
    });
  });
});
