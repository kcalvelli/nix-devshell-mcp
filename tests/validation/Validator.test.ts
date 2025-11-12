import { describe, it, expect, beforeEach } from 'vitest';
import { Validator } from '../../src/validation/Validator.js';
import { McpError, ErrorCode } from '../../src/utils/errors.js';

describe('Validator', () => {
  let validator: Validator;

  beforeEach(() => {
    validator = new Validator();
  });

  describe('validateToolInput', () => {
    it('should accept valid tool input', () => {
      const input = {
        projectPath: '/path/to/project',
        profile: 'typescript-node',
        options: {
          nodeVersion: '20',
        },
      };

      expect(() => validator.validateToolInput(input)).not.toThrow();
    });

    it('should reject input without projectPath', () => {
      const input = {
        profile: 'typescript-node',
      };

      expect(() => validator.validateToolInput(input)).toThrow(McpError);
    });

    it('should reject input without profile', () => {
      const input = {
        projectPath: '/path/to/project',
      };

      expect(() => validator.validateToolInput(input)).toThrow(McpError);
    });

    it('should reject invalid profile name format', () => {
      const input = {
        projectPath: '/path/to/project',
        profile: 'Invalid Profile!',
      };

      expect(() => validator.validateToolInput(input)).toThrow(McpError);
    });

    it('should accept valid profile name with hyphens', () => {
      const input = {
        projectPath: '/path/to/project',
        profile: 'typescript-node-app',
      };

      expect(() => validator.validateToolInput(input)).not.toThrow();
    });

    it('should reject empty projectPath', () => {
      const input = {
        projectPath: '',
        profile: 'typescript-node',
      };

      expect(() => validator.validateToolInput(input)).toThrow(McpError);
    });
  });

  describe('validateConfig', () => {
    it('should accept valid config with email', () => {
      const config = {
        email: 'user@example.com',
        name: 'Test User',
        nodeVersion: '20',
      };

      expect(() => validator.validateConfig(config)).not.toThrow();
    });

    it('should reject invalid email format', () => {
      const config = {
        email: 'not-an-email',
      };

      expect(() => validator.validateConfig(config)).toThrow(McpError);
    });

    it('should accept valid version formats', () => {
      const config = {
        nodeVersion: '20',
        pythonVersion: '3.11',
        javaVersion: '17',
      };

      expect(() => validator.validateConfig(config)).not.toThrow();
    });

    it('should accept config with private registry', () => {
      const config = {
        privateRegistry: {
          npm: {
            registry: 'https://registry.example.com',
            authToken: 'token123',
          },
        },
      };

      expect(() => validator.validateConfig(config)).not.toThrow();
    });

    it('should accept config with boolean flags', () => {
      const config = {
        gitAutoInit: true,
      };

      expect(() => validator.validateConfig(config)).not.toThrow();
    });

    it('should accept config with array of packages', () => {
      const config = {
        defaultPackages: ['git', 'vim', 'curl'],
      };

      expect(() => validator.validateConfig(config)).not.toThrow();
    });
  });

  describe('validateProfileOptions', () => {
    it('should accept options without schema', () => {
      const options = {
        nodeVersion: '20',
        projectName: 'test',
      };

      expect(() => validator.validateProfileOptions(options)).not.toThrow();
    });

    it('should reject non-object options', () => {
      expect(() => validator.validateProfileOptions('not an object')).toThrow(McpError);
      expect(() => validator.validateProfileOptions(null)).toThrow(McpError);
      expect(() => validator.validateProfileOptions([])).toThrow(McpError);
    });

    it('should validate against custom schema', () => {
      const schema = {
        type: 'object',
        properties: {
          nodeVersion: {
            type: 'string',
            pattern: '^\\d+$',
          },
        },
        required: ['nodeVersion'],
      };

      const validOptions = {
        nodeVersion: '20',
      };

      expect(() => validator.validateProfileOptions(validOptions, schema)).not.toThrow();
    });

    it('should reject options that do not match schema', () => {
      const schema = {
        type: 'object',
        properties: {
          nodeVersion: {
            type: 'string',
            pattern: '^\\d+$',
          },
        },
        required: ['nodeVersion'],
      };

      const invalidOptions = {
        nodeVersion: 'invalid',
      };

      expect(() => validator.validateProfileOptions(invalidOptions, schema)).toThrow(McpError);
    });

    it('should reject missing required fields', () => {
      const schema = {
        type: 'object',
        properties: {
          requiredField: {
            type: 'string',
          },
        },
        required: ['requiredField'],
      };

      const invalidOptions = {};

      expect(() => validator.validateProfileOptions(invalidOptions, schema)).toThrow(McpError);
    });
  });

  describe('validatePath', () => {
    it('should accept valid path string', () => {
      expect(() => validator.validatePath('/valid/path')).not.toThrow();
    });

    it('should reject empty path', () => {
      expect(() => validator.validatePath('')).toThrow(McpError);
    });

    it('should reject non-string path', () => {
      expect(() => validator.validatePath(null as any)).toThrow(McpError);
      expect(() => validator.validatePath(123 as any)).toThrow(McpError);
    });

    it('should reject path with null bytes', () => {
      expect(() => validator.validatePath('/path\0/with/null')).toThrow(McpError);
    });

    it('should reject path with traversal', () => {
      expect(() => validator.validatePath('/path/../traversal')).toThrow(McpError);
    });
  });
});
