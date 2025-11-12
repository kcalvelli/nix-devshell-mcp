import Ajv, { type ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { ErrorCode, McpError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export class Validator {
  private ajv: Ajv;
  private toolInputValidator: ValidateFunction;
  private configValidator: ValidateFunction;

  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false,
    });
    addFormats(this.ajv);

    this.toolInputValidator = this.ajv.compile(this.getToolInputSchema());
    this.configValidator = this.ajv.compile(this.getConfigSchema());
  }

  validateToolInput(input: unknown): void {
    if (!this.toolInputValidator(input)) {
      const errors = this.toolInputValidator.errors || [];
      const errorMessages = errors.map((err) => `${err.instancePath} ${err.message}`).join(', ');
      logger.error(`Tool input validation failed: ${errorMessages}`);
      throw new McpError(ErrorCode.INVALID_INPUT, `Invalid tool input: ${errorMessages}`, {
        errors,
      });
    }
    logger.debug('Tool input validation passed');
  }

  validateConfig(config: unknown): void {
    if (!this.configValidator(config)) {
      const errors = this.configValidator.errors || [];
      const errorMessages = errors.map((err) => `${err.instancePath} ${err.message}`).join(', ');
      logger.error(`Config validation failed: ${errorMessages}`);
      throw new McpError(ErrorCode.INVALID_CONFIG, `Invalid configuration: ${errorMessages}`, {
        errors,
      });
    }
    logger.debug('Config validation passed');
  }

  validateProfileOptions(options: unknown, profileSchema?: Record<string, unknown>): void {
    if (!profileSchema) {
      // No custom schema provided, just validate it's an object
      if (typeof options !== 'object' || options === null || Array.isArray(options)) {
        throw new McpError(
          ErrorCode.INVALID_OPTIONS,
          'Profile options must be an object',
          { options },
        );
      }
      logger.debug('Profile options validation passed (no schema)');
      return;
    }

    const validator = this.ajv.compile(profileSchema);
    if (!validator(options)) {
      const errors = validator.errors || [];
      const errorMessages = errors.map((err) => `${err.instancePath} ${err.message}`).join(', ');
      logger.error(`Profile options validation failed: ${errorMessages}`);
      throw new McpError(
        ErrorCode.INVALID_OPTIONS,
        `Invalid profile options: ${errorMessages}`,
        { errors },
      );
    }
    logger.debug('Profile options validation passed');
  }

  private getToolInputSchema(): Record<string, unknown> {
    return {
      type: 'object',
      required: ['projectPath', 'profile'],
      properties: {
        projectPath: {
          type: 'string',
          minLength: 1,
          description: 'Path to the project directory',
        },
        profile: {
          type: 'string',
          minLength: 1,
          pattern: '^[a-z0-9][a-z0-9-]*$',
          description: 'Profile name (lowercase, alphanumeric with hyphens)',
        },
        options: {
          type: 'object',
          description: 'Optional configuration overrides',
          additionalProperties: true,
        },
      },
      additionalProperties: false,
    };
  }

  private getConfigSchema(): Record<string, unknown> {
    return {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          format: 'email',
          description: 'User email address',
        },
        name: {
          type: 'string',
          minLength: 1,
          description: 'User full name',
        },
        gitAutoInit: {
          type: 'boolean',
          description: 'Automatically initialize git repository',
        },
        defaultPackages: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'Default packages to include in all profiles',
        },
        privateRegistry: {
          type: 'object',
          properties: {
            npm: {
              type: 'object',
              properties: {
                registry: {
                  type: 'string',
                  format: 'uri',
                },
                authToken: {
                  type: 'string',
                },
              },
            },
            pypi: {
              type: 'object',
              properties: {
                index: {
                  type: 'string',
                  format: 'uri',
                },
                indexUrl: {
                  type: 'string',
                  format: 'uri',
                },
              },
            },
            maven: {
              type: 'object',
              properties: {
                repository: {
                  type: 'string',
                  format: 'uri',
                },
                username: {
                  type: 'string',
                },
                password: {
                  type: 'string',
                },
              },
            },
          },
        },
        nodeVersion: {
          type: 'string',
          pattern: '^\\d+(\\.\\d+)?(\\.\\d+)?$',
          description: 'Node.js version (e.g., "20", "20.11", "20.11.1")',
        },
        pythonVersion: {
          type: 'string',
          pattern: '^\\d+(\\.\\d+)?(\\.\\d+)?$',
          description: 'Python version (e.g., "3.11", "3.11.5")',
        },
        javaVersion: {
          type: 'string',
          pattern: '^\\d+$',
          description: 'Java version (e.g., "17", "21")',
        },
        projectName: {
          type: 'string',
          minLength: 1,
          description: 'Project name',
        },
        description: {
          type: 'string',
          description: 'Project description',
        },
      },
      additionalProperties: true,
    };
  }

  validatePath(path: string): void {
    if (!path || typeof path !== 'string') {
      throw new McpError(ErrorCode.INVALID_PATH, 'Path must be a non-empty string', { path });
    }

    // Check for null bytes
    if (path.includes('\0')) {
      throw new McpError(ErrorCode.INVALID_PATH, 'Path contains null bytes', { path });
    }

    // Check for path traversal patterns
    if (path.includes('..')) {
      throw new McpError(ErrorCode.INVALID_PATH, 'Path traversal detected', { path });
    }

    logger.debug(`Path validation passed: ${path}`);
  }
}
