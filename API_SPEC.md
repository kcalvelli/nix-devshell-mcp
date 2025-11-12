# API Specification

**Project**: nix-devshell-mcp
**Version**: 1.0.0
**Protocol**: Model Context Protocol (MCP) 1.0
**Last Updated**: 2025-11-12

---

## Table of Contents

1. [Overview](#overview)
2. [MCP Tools](#mcp-tools)
3. [create_devshell Tool](#create_devshell-tool)
4. [list_profiles Tool](#list_profiles-tool)
5. [Profile-Specific Options](#profile-specific-options)
6. [Error Codes](#error-codes)
7. [Configuration API](#configuration-api)

---

## Overview

The nix-devshell-mcp server exposes two MCP tools for generating Nix flake development environments:

1. **create_devshell** - Generate a new Nix flake project from a template
2. **list_profiles** - List available project templates with their options

### Transport

- **Protocol**: Model Context Protocol (MCP) v1.0
- **Transport**: stdio
- **Encoding**: JSON

### Authentication

No authentication required. The server operates with the permissions of the user running it.

---

## MCP Tools

### Tool Registry

```json
{
  "tools": [
    {
      "name": "create_devshell",
      "description": "Create a new Nix flake development environment from a template profile",
      "inputSchema": {
        "type": "object",
        "required": ["projectPath", "profile"],
        "properties": {
          "projectPath": {
            "type": "string",
            "description": "Path where the project should be created (absolute or relative)"
          },
          "profile": {
            "type": "string",
            "enum": ["typescript-node", "angular-frontend", "python-fastapi", "java-spring-boot"],
            "description": "Template profile to use"
          },
          "options": {
            "type": "object",
            "description": "Profile-specific configuration options",
            "additionalProperties": true
          }
        }
      }
    },
    {
      "name": "list_profiles",
      "description": "List all available project template profiles with their supported options",
      "inputSchema": {
        "type": "object",
        "properties": {}
      }
    }
  ]
}
```

---

## create_devshell Tool

### Description

Creates a new Nix flake development environment based on a template profile. Generates all necessary files including flake.nix, .envrc, starter code, and configuration files.

### Input Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["projectPath", "profile"],
  "properties": {
    "projectPath": {
      "type": "string",
      "minLength": 1,
      "description": "Path to the project directory. Can be absolute or relative. Directory will be created if it doesn't exist.",
      "examples": [
        "./my-project",
        "/home/user/projects/my-api",
        "../backend-service"
      ]
    },
    "profile": {
      "type": "string",
      "enum": [
        "typescript-node",
        "angular-frontend",
        "python-fastapi",
        "java-spring-boot"
      ],
      "description": "The template profile to use for project generation"
    },
    "options": {
      "type": "object",
      "description": "Profile-specific configuration options. See profile-specific schemas for details.",
      "additionalProperties": true
    }
  },
  "additionalProperties": false
}
```

### Output Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["success", "message", "projectPath"],
  "properties": {
    "success": {
      "type": "boolean",
      "description": "Whether the operation succeeded"
    },
    "message": {
      "type": "string",
      "description": "Human-readable status message"
    },
    "projectPath": {
      "type": "string",
      "description": "Absolute path to the created project"
    },
    "filesCreated": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "List of files that were created"
    },
    "filesSkipped": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "List of files that were skipped (already existed)"
    },
    "nextSteps": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "Recommended next steps for the user"
    }
  }
}
```

### Behavior

1. **Directory Creation**: Creates project directory if it doesn't exist
2. **Non-Destructive**: Never overwrites existing files
3. **Git Initialization**: Runs `git init` if .git doesn't exist (via post-create hook)
4. **File Permissions**: Sets appropriate permissions (executables get 0755)
5. **Logging**: Logs all operations to stderr

### Examples

#### Example 1: Basic TypeScript Project

**Request**:
```json
{
  "method": "tools/call",
  "params": {
    "name": "create_devshell",
    "arguments": {
      "projectPath": "./my-backend",
      "profile": "typescript-node"
    }
  }
}
```

**Response**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"success\":true,\"message\":\"Project created successfully at /home/user/my-backend\",\"projectPath\":\"/home/user/my-backend\",\"filesCreated\":[\"flake.nix\",\".envrc\",\"package.json\",\"tsconfig.json\",\"src/index.ts\",\"src/types.ts\",\".gitignore\",\"README.md\",\".prettierrc\",\".eslintrc.json\"],\"filesSkipped\":[],\"nextSteps\":[\"cd /home/user/my-backend\",\"direnv allow\",\"npm install (if needed)\",\"npm run dev\"]}"
    }
  ]
}
```

#### Example 2: Python FastAPI with PostgreSQL

**Request**:
```json
{
  "method": "tools/call",
  "params": {
    "name": "create_devshell",
    "arguments": {
      "projectPath": "./api-service",
      "profile": "python-fastapi",
      "options": {
        "pythonVersion": "3.11",
        "includeDatabase": true,
        "databaseType": "postgresql"
      }
    }
  }
}
```

**Response**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"success\":true,\"message\":\"Project created successfully at /home/user/api-service\",\"projectPath\":\"/home/user/api-service\",\"filesCreated\":[\"flake.nix\",\".envrc\",\"pyproject.toml\",\"src/main.py\",\"src/config.py\",\"src/database.py\",\"tests/test_main.py\",\".gitignore\",\"README.md\",\"alembic.ini\"],\"filesSkipped\":[],\"nextSteps\":[\"cd /home/user/api-service\",\"direnv allow\",\"poetry install (if needed)\",\"poetry run uvicorn src.main:app --reload\"]}"
    }
  ]
}
```

#### Example 3: Existing Directory (Some Files Skip)

**Request**:
```json
{
  "method": "tools/call",
  "params": {
    "name": "create_devshell",
    "arguments": {
      "projectPath": "./existing-project",
      "profile": "angular-frontend"
    }
  }
}
```

**Response**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"success\":true,\"message\":\"Project created successfully at /home/user/existing-project (some files skipped)\",\"projectPath\":\"/home/user/existing-project\",\"filesCreated\":[\"flake.nix\",\".envrc\"],\"filesSkipped\":[\"package.json\",\"tsconfig.json\",\"README.md\"],\"nextSteps\":[\"cd /home/user/existing-project\",\"direnv allow\",\"npm install (if needed)\",\"npm start\"]}"
    }
  ]
}
```

### Error Responses

#### Profile Not Found

```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"error\":{\"code\":\"PROFILE_NOT_FOUND\",\"message\":\"Profile 'react-frontend' not found. Available profiles: typescript-node, angular-frontend, python-fastapi, java-spring-boot\"}}"
    }
  ],
  "isError": true
}
```

#### Invalid Path

```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"error\":{\"code\":\"INVALID_PATH\",\"message\":\"Path traversal detected in project path\",\"details\":{\"path\":\"../../etc/passwd\"}}}"
    }
  ],
  "isError": true
}
```

#### Invalid Options

```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"error\":{\"code\":\"INVALID_OPTIONS\",\"message\":\"Invalid option 'nodeVersion': must be one of [18, 20, 22]\",\"details\":{\"option\":\"nodeVersion\",\"value\":\"16\",\"allowed\":[\"18\",\"20\",\"22\"]}}}"
    }
  ],
  "isError": true
}
```

---

## list_profiles Tool

### Description

Returns a list of all available project template profiles with their metadata, supported options, and examples.

### Input Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {},
  "additionalProperties": false
}
```

### Output Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["profiles"],
  "properties": {
    "profiles": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["name", "displayName", "description", "version"],
        "properties": {
          "name": {
            "type": "string",
            "description": "Profile identifier (used in create_devshell)"
          },
          "displayName": {
            "type": "string",
            "description": "Human-readable profile name"
          },
          "description": {
            "type": "string",
            "description": "Detailed description of the profile"
          },
          "version": {
            "type": "string",
            "description": "Profile version (semantic versioning)"
          },
          "supportedOptions": {
            "type": "array",
            "description": "Configuration options supported by this profile",
            "items": {
              "type": "object",
              "required": ["name", "type", "description", "required"],
              "properties": {
                "name": {
                  "type": "string"
                },
                "type": {
                  "type": "string",
                  "enum": ["string", "number", "boolean", "array"]
                },
                "description": {
                  "type": "string"
                },
                "required": {
                  "type": "boolean"
                },
                "default": {
                  "description": "Default value if not provided"
                },
                "enum": {
                  "type": "array",
                  "description": "Allowed values (for string type)"
                }
              }
            }
          },
          "tags": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "Tags for categorization"
          },
          "examples": {
            "type": "array",
            "items": {
              "type": "string"
            },
            "description": "Example use cases"
          }
        }
      }
    }
  }
}
```

### Example

**Request**:
```json
{
  "method": "tools/call",
  "params": {
    "name": "list_profiles"
  }
}
```

**Response**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\"profiles\":[{\"name\":\"typescript-node\",\"displayName\":\"TypeScript Node.js Backend\",\"description\":\"Node.js backend with TypeScript, Express, and Vitest\",\"version\":\"1.0.0\",\"supportedOptions\":[{\"name\":\"nodeVersion\",\"type\":\"string\",\"description\":\"Node.js version (18, 20, 22)\",\"required\":false,\"default\":\"20\",\"enum\":[\"18\",\"20\",\"22\"]},{\"name\":\"includeDatabase\",\"type\":\"boolean\",\"description\":\"Include PostgreSQL in devshell\",\"required\":false,\"default\":false}],\"tags\":[\"backend\",\"typescript\",\"nodejs\",\"express\"],\"examples\":[\"Create a Node.js API with TypeScript\",\"Build a backend service with Express\"]},{\"name\":\"angular-frontend\",\"displayName\":\"Angular Frontend\",\"description\":\"Angular SPA with TypeScript and standalone components\",\"version\":\"1.0.0\",\"supportedOptions\":[{\"name\":\"nodeVersion\",\"type\":\"string\",\"description\":\"Node.js version (18, 20, 22)\",\"required\":false,\"default\":\"20\",\"enum\":[\"18\",\"20\",\"22\"]},{\"name\":\"angularVersion\",\"type\":\"string\",\"description\":\"Angular version\",\"required\":false,\"default\":\"17\"}],\"tags\":[\"frontend\",\"angular\",\"spa\",\"typescript\"],\"examples\":[\"Create an Angular application\",\"Build a web frontend with Angular\"]},{\"name\":\"python-fastapi\",\"displayName\":\"Python FastAPI Backend\",\"description\":\"Python FastAPI backend with async support and PostgreSQL\",\"version\":\"1.0.0\",\"supportedOptions\":[{\"name\":\"pythonVersion\",\"type\":\"string\",\"description\":\"Python version (3.10, 3.11, 3.12)\",\"required\":false,\"default\":\"3.11\",\"enum\":[\"3.10\",\"3.11\",\"3.12\"]},{\"name\":\"includeDatabase\",\"type\":\"boolean\",\"description\":\"Include PostgreSQL in devshell\",\"required\":false,\"default\":false}],\"tags\":[\"backend\",\"python\",\"fastapi\",\"async\"],\"examples\":[\"Create a FastAPI service\",\"Build a Python API with PostgreSQL\"]},{\"name\":\"java-spring-boot\",\"displayName\":\"Java Spring Boot Backend\",\"description\":\"Java Spring Boot backend with Maven and Spring Data JPA\",\"version\":\"1.0.0\",\"supportedOptions\":[{\"name\":\"javaVersion\",\"type\":\"string\",\"description\":\"Java version (17, 21)\",\"required\":false,\"default\":\"21\",\"enum\":[\"17\",\"21\"]},{\"name\":\"springBootVersion\",\"type\":\"string\",\"description\":\"Spring Boot version\",\"required\":false,\"default\":\"3.2.0\"}],\"tags\":[\"backend\",\"java\",\"spring-boot\",\"enterprise\"],\"examples\":[\"Create a Spring Boot microservice\",\"Build a Java REST API\"]}]}"
    }
  ]
}
```

---

## Profile-Specific Options

### typescript-node Profile

#### Options Schema

```json
{
  "type": "object",
  "properties": {
    "nodeVersion": {
      "type": "string",
      "enum": ["18", "20", "22"],
      "default": "20",
      "description": "Node.js version to use"
    },
    "packageManager": {
      "type": "string",
      "enum": ["npm", "yarn", "pnpm"],
      "default": "npm",
      "description": "Package manager to use"
    },
    "includeDatabase": {
      "type": "boolean",
      "default": false,
      "description": "Include PostgreSQL in devshell"
    },
    "databaseType": {
      "type": "string",
      "enum": ["postgresql", "mysql"],
      "default": "postgresql",
      "description": "Database type (only used if includeDatabase is true)"
    },
    "includeRedis": {
      "type": "boolean",
      "default": false,
      "description": "Include Redis in devshell"
    },
    "framework": {
      "type": "string",
      "enum": ["express", "fastify"],
      "default": "express",
      "description": "HTTP framework to use"
    }
  }
}
```

#### Example Invocations

```json
// Minimal
{
  "projectPath": "./my-api",
  "profile": "typescript-node"
}

// With options
{
  "projectPath": "./my-api",
  "profile": "typescript-node",
  "options": {
    "nodeVersion": "20",
    "includeDatabase": true,
    "framework": "express"
  }
}

// Full configuration
{
  "projectPath": "./my-api",
  "profile": "typescript-node",
  "options": {
    "nodeVersion": "22",
    "packageManager": "pnpm",
    "includeDatabase": true,
    "databaseType": "postgresql",
    "includeRedis": true,
    "framework": "fastify"
  }
}
```

---

### angular-frontend Profile

#### Options Schema

```json
{
  "type": "object",
  "properties": {
    "nodeVersion": {
      "type": "string",
      "enum": ["18", "20", "22"],
      "default": "20",
      "description": "Node.js version to use"
    },
    "angularVersion": {
      "type": "string",
      "enum": ["17", "18"],
      "default": "17",
      "description": "Angular version"
    },
    "packageManager": {
      "type": "string",
      "enum": ["npm", "yarn", "pnpm"],
      "default": "npm",
      "description": "Package manager to use"
    },
    "styling": {
      "type": "string",
      "enum": ["css", "scss", "sass"],
      "default": "scss",
      "description": "Stylesheet format"
    },
    "includeRouter": {
      "type": "boolean",
      "default": true,
      "description": "Include Angular Router"
    },
    "ssr": {
      "type": "boolean",
      "default": false,
      "description": "Enable Server-Side Rendering (SSR)"
    }
  }
}
```

#### Example Invocations

```json
// Minimal
{
  "projectPath": "./my-app",
  "profile": "angular-frontend"
}

// With routing and SCSS
{
  "projectPath": "./my-app",
  "profile": "angular-frontend",
  "options": {
    "includeRouter": true,
    "styling": "scss"
  }
}

// With SSR
{
  "projectPath": "./my-app",
  "profile": "angular-frontend",
  "options": {
    "angularVersion": "18",
    "ssr": true,
    "styling": "scss"
  }
}
```

---

### python-fastapi Profile

#### Options Schema

```json
{
  "type": "object",
  "properties": {
    "pythonVersion": {
      "type": "string",
      "enum": ["3.10", "3.11", "3.12"],
      "default": "3.11",
      "description": "Python version to use"
    },
    "dependencyManager": {
      "type": "string",
      "enum": ["poetry", "pip-tools"],
      "default": "poetry",
      "description": "Python dependency manager"
    },
    "includeDatabase": {
      "type": "boolean",
      "default": false,
      "description": "Include PostgreSQL in devshell"
    },
    "databaseType": {
      "type": "string",
      "enum": ["postgresql", "mysql"],
      "default": "postgresql",
      "description": "Database type"
    },
    "includeRedis": {
      "type": "boolean",
      "default": false,
      "description": "Include Redis in devshell"
    },
    "includeAlembic": {
      "type": "boolean",
      "default": true,
      "description": "Include Alembic for database migrations"
    },
    "orm": {
      "type": "string",
      "enum": ["sqlalchemy", "tortoise"],
      "default": "sqlalchemy",
      "description": "ORM library to use"
    }
  }
}
```

#### Example Invocations

```json
// Minimal
{
  "projectPath": "./api",
  "profile": "python-fastapi"
}

// With database
{
  "projectPath": "./api",
  "profile": "python-fastapi",
  "options": {
    "pythonVersion": "3.11",
    "includeDatabase": true,
    "includeAlembic": true
  }
}

// Full stack with Redis
{
  "projectPath": "./api",
  "profile": "python-fastapi",
  "options": {
    "pythonVersion": "3.12",
    "includeDatabase": true,
    "includeRedis": true,
    "includeAlembic": true,
    "orm": "sqlalchemy"
  }
}
```

---

### java-spring-boot Profile

#### Options Schema

```json
{
  "type": "object",
  "properties": {
    "javaVersion": {
      "type": "string",
      "enum": ["17", "21"],
      "default": "21",
      "description": "Java version to use"
    },
    "springBootVersion": {
      "type": "string",
      "enum": ["3.1.0", "3.2.0"],
      "default": "3.2.0",
      "description": "Spring Boot version"
    },
    "buildTool": {
      "type": "string",
      "enum": ["maven", "gradle"],
      "default": "maven",
      "description": "Build tool"
    },
    "includeDatabase": {
      "type": "boolean",
      "default": false,
      "description": "Include PostgreSQL in devshell and Spring Data JPA"
    },
    "databaseType": {
      "type": "string",
      "enum": ["postgresql", "mysql", "h2"],
      "default": "postgresql",
      "description": "Database type"
    },
    "includeRedis": {
      "type": "boolean",
      "default": false,
      "description": "Include Redis in devshell and Spring Data Redis"
    },
    "includeSecurity": {
      "type": "boolean",
      "default": false,
      "description": "Include Spring Security"
    },
    "packaging": {
      "type": "string",
      "enum": ["jar", "war"],
      "default": "jar",
      "description": "Packaging type"
    }
  }
}
```

#### Example Invocations

```json
// Minimal
{
  "projectPath": "./service",
  "profile": "java-spring-boot"
}

// With database
{
  "projectPath": "./service",
  "profile": "java-spring-boot",
  "options": {
    "javaVersion": "21",
    "includeDatabase": true,
    "databaseType": "postgresql"
  }
}

// Enterprise configuration
{
  "projectPath": "./service",
  "profile": "java-spring-boot",
  "options": {
    "javaVersion": "21",
    "springBootVersion": "3.2.0",
    "buildTool": "maven",
    "includeDatabase": true,
    "databaseType": "postgresql",
    "includeSecurity": true,
    "packaging": "jar"
  }
}
```

---

## Error Codes

### Complete Error Code Reference

| Code | HTTP Equivalent | Description | User Action |
|------|----------------|-------------|-------------|
| `INVALID_INPUT` | 400 | Input validation failed | Check input against schema |
| `PROFILE_NOT_FOUND` | 404 | Specified profile doesn't exist | Use `list_profiles` to see available profiles |
| `INVALID_OPTIONS` | 400 | Profile options validation failed | Check profile's supported options |
| `INVALID_PATH` | 400 | Path validation failed (e.g., traversal) | Use valid path within workspace |
| `INVALID_CONFIG` | 400 | Configuration file is invalid | Validate config against schema |
| `FILESYSTEM_ERROR` | 500 | General filesystem operation failed | Check permissions and disk space |
| `PERMISSION_DENIED` | 403 | Insufficient permissions | Check file/directory permissions |
| `DIRECTORY_NOT_FOUND` | 404 | Target directory doesn't exist | Create directory or use valid path |
| `TEMPLATE_ERROR` | 500 | Template file is malformed | Report bug with profile name |
| `RENDER_ERROR` | 500 | Template rendering failed | Check template syntax and context |
| `HOOK_EXECUTION_FAILED` | 500 | Post-create hook failed | Check hook script and permissions |
| `HOOK_TIMEOUT` | 504 | Hook execution exceeded timeout | Simplify hook or increase timeout |
| `INTERNAL_ERROR` | 500 | Unexpected internal error | Report bug with error details |
| `UNKNOWN_ERROR` | 500 | Unclassified error | Report bug with full context |

### Error Response Format

All errors follow this structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error description",
    "details": {
      // Optional additional context
    }
  }
}
```

### Error Handling Examples

#### Invalid Profile

```json
{
  "error": {
    "code": "PROFILE_NOT_FOUND",
    "message": "Profile 'react-native' not found. Available profiles: typescript-node, angular-frontend, python-fastapi, java-spring-boot",
    "details": {
      "requestedProfile": "react-native",
      "availableProfiles": [
        "typescript-node",
        "angular-frontend",
        "python-fastapi",
        "java-spring-boot"
      ]
    }
  }
}
```

#### Invalid Option Value

```json
{
  "error": {
    "code": "INVALID_OPTIONS",
    "message": "Option 'pythonVersion' must be one of: 3.10, 3.11, 3.12 (received: '3.9')",
    "details": {
      "option": "pythonVersion",
      "value": "3.9",
      "allowed": ["3.10", "3.11", "3.12"],
      "profile": "python-fastapi"
    }
  }
}
```

#### Path Traversal Attempt

```json
{
  "error": {
    "code": "INVALID_PATH",
    "message": "Path traversal detected: path must not contain '..'",
    "details": {
      "providedPath": "../../etc/passwd",
      "reason": "Path traversal attempt"
    }
  }
}
```

#### Permission Denied

```json
{
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "Permission denied: Cannot write to /usr/local/my-project",
    "details": {
      "path": "/usr/local/my-project",
      "operation": "mkdir",
      "errno": "EACCES"
    }
  }
}
```

---

## Configuration API

### User Configuration File

**Location**: `~/.config/nix-devshell-mcp/config.json`

**Schema**:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "author": {
      "type": "string",
      "description": "Default author name"
    },
    "email": {
      "type": "string",
      "format": "email",
      "description": "Default author email"
    },
    "organization": {
      "type": "string",
      "description": "Organization name"
    },
    "defaults": {
      "type": "object",
      "properties": {
        "nodeVersion": {
          "type": "string"
        },
        "pythonVersion": {
          "type": "string"
        },
        "javaVersion": {
          "type": "string"
        }
      }
    },
    "registries": {
      "type": "object",
      "properties": {
        "npm": {
          "type": "string",
          "format": "uri",
          "description": "NPM registry URL"
        },
        "pypi": {
          "type": "string",
          "format": "uri",
          "description": "PyPI index URL"
        },
        "maven": {
          "type": "string",
          "format": "uri",
          "description": "Maven repository URL"
        }
      }
    },
    "profileDefaults": {
      "type": "object",
      "additionalProperties": {
        "type": "object"
      },
      "description": "Default options per profile"
    }
  }
}
```

**Example**:
```json
{
  "author": "Jane Developer",
  "email": "jane@example.com",
  "organization": "Acme Corp",
  "defaults": {
    "nodeVersion": "20",
    "pythonVersion": "3.11",
    "javaVersion": "21"
  },
  "registries": {
    "npm": "https://registry.npmjs.org",
    "pypi": "https://pypi.org/simple",
    "maven": "https://repo.maven.apache.org/maven2"
  },
  "profileDefaults": {
    "typescript-node": {
      "framework": "express",
      "includeDatabase": false
    },
    "python-fastapi": {
      "dependencyManager": "poetry",
      "includeAlembic": true
    }
  }
}
```

### Project Configuration File

**Location**: `{projectPath}/devshell-config.json`

**Schema**: Same as user config, but project-specific

**Example**:
```json
{
  "registries": {
    "npm": "https://npm.internal.example.com",
    "pypi": "https://pypi.internal.example.com/simple"
  },
  "defaults": {
    "nodeVersion": "20"
  }
}
```

### Configuration Priority

When creating a project, configurations are merged in this order (later overrides earlier):

1. System defaults (hardcoded)
2. Profile defaults (from profile.json)
3. User config (`~/.config/nix-devshell-mcp/config.json`)
4. Project config (`./devshell-config.json` in target directory)
5. Tool invocation options (highest priority)

### Environment Variables in Config

Configs can reference environment variables:

```json
{
  "registries": {
    "npm": "${NPM_REGISTRY_URL}",
    "npmToken": "${NPM_TOKEN}"
  }
}
```

These are resolved at runtime using `process.env`.

---

## Usage Patterns

### Pattern 1: Quick Start

```
User: "Create a TypeScript backend project called 'my-api'"
AI: *calls create_devshell*
{
  "projectPath": "./my-api",
  "profile": "typescript-node"
}
```

### Pattern 2: Specific Version

```
User: "Create a Python FastAPI project with Python 3.12"
AI: *calls create_devshell*
{
  "projectPath": "./api",
  "profile": "python-fastapi",
  "options": {
    "pythonVersion": "3.12"
  }
}
```

### Pattern 3: Full Stack

```
User: "Create a Java Spring Boot service with PostgreSQL and Redis"
AI: *calls create_devshell*
{
  "projectPath": "./service",
  "profile": "java-spring-boot",
  "options": {
    "includeDatabase": true,
    "databaseType": "postgresql",
    "includeRedis": true
  }
}
```

### Pattern 4: Discovery

```
User: "What kind of projects can you create?"
AI: *calls list_profiles*
{}

AI: "I can create the following types of projects:
- TypeScript Node.js Backend (typescript-node)
- Angular Frontend (angular-frontend)
- Python FastAPI Backend (python-fastapi)
- Java Spring Boot Backend (java-spring-boot)

Each profile supports various options like version selection and database inclusion."
```

---

## Versioning

### API Version

- **Current Version**: 1.0.0
- **MCP Protocol**: 1.0
- **Compatibility**: Breaking changes will increment major version

### Profile Versions

Each profile has its own semantic version (e.g., "1.0.0"). Profile versions are included in `list_profiles` output.

### Changelog

Future versions will maintain a CHANGELOG.md with:
- New profiles
- New options for existing profiles
- Breaking changes
- Bug fixes

---

**Document Owner**: API Team
**Review Cycle**: Before each release
**Next Review**: After MVP implementation