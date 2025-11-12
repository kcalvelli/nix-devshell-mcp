#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { DevshellTool } from './tools/DevshellTool.js';
import { logger, LogLevel } from './utils/logger.js';
import { McpError } from './utils/errors.js';
import type { CreateDevshellInput } from './types.js';

// Set log level from environment
const logLevel = process.env.LOG_LEVEL as LogLevel;
if (logLevel) {
  logger.setLevel(logLevel);
}

async function main() {
  logger.info('Starting nix-devshell-mcp server...');

  // Initialize DevshellTool
  const devshellTool = new DevshellTool();
  await devshellTool.initialize();

  // Create MCP server
  const server = new Server(
    {
      name: 'nix-devshell-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    },
  );

  // Register tool: list_profiles
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'create_devshell',
          description:
            'Creates a Nix flake development environment from a template profile. ' +
            'Generates flake.nix, direnv configuration, and scaffolding files. ' +
            'Non-destructive: will not overwrite existing files.',
          inputSchema: {
            type: 'object',
            properties: {
              projectPath: {
                type: 'string',
                description: 'Absolute path to the project directory',
              },
              profile: {
                type: 'string',
                description:
                  'Profile name (e.g., "typescript-node", "python-fastapi", "angular-frontend", "java-spring-boot")',
              },
              options: {
                type: 'object',
                description: 'Optional configuration overrides',
                properties: {
                  projectName: {
                    type: 'string',
                    description: 'Project name',
                  },
                  description: {
                    type: 'string',
                    description: 'Project description',
                  },
                  nodeVersion: {
                    type: 'string',
                    description: 'Node.js version (e.g., "20")',
                  },
                  pythonVersion: {
                    type: 'string',
                    description: 'Python version (e.g., "3.11")',
                  },
                  javaVersion: {
                    type: 'string',
                    description: 'Java version (e.g., "17")',
                  },
                  email: {
                    type: 'string',
                    description: 'Email address',
                  },
                  name: {
                    type: 'string',
                    description: 'Full name',
                  },
                  gitAutoInit: {
                    type: 'boolean',
                    description: 'Automatically initialize git repository',
                  },
                },
                additionalProperties: true,
              },
            },
            required: ['projectPath', 'profile'],
          },
        },
        {
          name: 'list_profiles',
          description:
            'Lists all available development environment profiles with their descriptions. ' +
            'Use this to discover which profiles are available before creating a devshell.',
          inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false,
          },
        },
      ],
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'create_devshell': {
          const input = args as unknown as CreateDevshellInput;
          const result = await devshellTool.createDevshell(input);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case 'list_profiles': {
          const profiles = devshellTool.listProfiles();

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    profiles: profiles.map((p) => ({
                      name: p.name,
                      description: p.description,
                      version: p.version,
                      tags: p.tags,
                    })),
                  },
                  null,
                  2,
                ),
              },
            ],
          };
        }

        default:
          throw new McpError(
            'INVALID_INPUT' as any,
            `Unknown tool: ${name}`,
            { toolName: name },
          );
      }
    } catch (error) {
      if (error instanceof McpError) {
        logger.error(`Tool execution failed [${error.code}]: ${error.message}`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  error: error.message,
                  code: error.code,
                  details: error.details,
                },
                null,
                2,
              ),
            },
          ],
          isError: true,
        };
      }

      const err = error as Error;
      logger.error(`Unexpected error: ${err.message}`);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: err.message,
                code: 'UNKNOWN_ERROR',
              },
              null,
              2,
            ),
          },
        ],
        isError: true,
      };
    }
  });

  // Register resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [
        {
          uri: 'profiles://list',
          name: 'Available Profiles',
          description: 'List of all available development environment profiles',
          mimeType: 'application/json',
        },
      ],
    };
  });

  // Handle resource reads
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    if (uri === 'profiles://list') {
      const profiles = devshellTool.listProfiles();
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({ profiles }, null, 2),
          },
        ],
      };
    }

    throw new McpError(
      'INVALID_INPUT' as any,
      `Unknown resource: ${uri}`,
      { uri },
    );
  });

  // Start server
  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info('nix-devshell-mcp server started successfully');
}

main().catch((error) => {
  logger.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
