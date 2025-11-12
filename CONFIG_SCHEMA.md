# Configuration Schema

**Project**: nix-devshell-mcp
**Version**: 1.0.0
**Schema Version**: 1.0.0
**Last Updated**: 2025-11-12

---

## Table of Contents

1. [Overview](#overview)
2. [Configuration Files](#configuration-files)
3. [JSON Schema](#json-schema)
4. [Configuration Merge Logic](#configuration-merge-logic)
5. [Example Configurations](#example-configurations)
6. [Environment Variables](#environment-variables)
7. [Validation Rules](#validation-rules)

---

## Overview

The nix-devshell-mcp server supports two levels of configuration:

1. **User-level**: `~/.config/nix-devshell-mcp/config.json`
2. **Project-level**: `{projectPath}/devshell-config.json`

Both configuration files use the same schema and are merged according to a priority system.

### Configuration Priority

When generating a project, configurations are merged in this order (later overrides earlier):

1. **System defaults** (hardcoded in application)
2. **Profile defaults** (from `profile.json`)
3. **User config** (`~/.config/nix-devshell-mcp/config.json`)
4. **Project config** (`./devshell-config.json` in target directory)
5. **Tool options** (passed to `create_devshell` tool)

---

## Configuration Files

### User Configuration

**Location**: `~/.config/nix-devshell-mcp/config.json`

**Purpose**: Store personal defaults that apply to all projects

**Creation**: Created manually by the user

**Example**:
```json
{
  "author": "Jane Doe",
  "email": "jane@example.com",
  "defaults": {
    "nodeVersion": "20"
  }
}
```

### Project Configuration

**Location**: `{projectPath}/devshell-config.json`

**Purpose**: Store project-specific or team-wide settings

**Creation**: Can be created manually or committed to version control

**Example**:
```json
{
  "registries": {
    "npm": "https://npm.internal.company.com"
  },
  "defaults": {
    "nodeVersion": "18"
  }
}
```

---

## JSON Schema

### Complete Schema Definition

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://nix-devshell-mcp.example.com/config.schema.json",
  "title": "nix-devshell-mcp Configuration",
  "description": "Configuration schema for nix-devshell-mcp server",
  "type": "object",
  "properties": {
    "author": {
      "type": "string",
      "description": "Default author name for generated projects",
      "minLength": 1,
      "maxLength": 100,
      "examples": ["Jane Doe", "John Smith"]
    },
    "email": {
      "type": "string",
      "format": "email",
      "description": "Default author email for generated projects",
      "examples": ["jane@example.com"]
    },
    "organization": {
      "type": "string",
      "description": "Organization or company name",
      "minLength": 1,
      "maxLength": 100,
      "examples": ["Acme Corp", "Example Inc"]
    },
    "defaults": {
      "type": "object",
      "description": "Default values for common profile options",
      "properties": {
        "nodeVersion": {
          "type": "string",
          "description": "Default Node.js version",
          "enum": ["18", "20", "22"],
          "default": "20"
        },
        "pythonVersion": {
          "type": "string",
          "description": "Default Python version",
          "enum": ["3.10", "3.11", "3.12"],
          "default": "3.11"
        },
        "javaVersion": {
          "type": "string",
          "description": "Default Java version",
          "enum": ["17", "21"],
          "default": "21"
        },
        "packageManager": {
          "type": "string",
          "description": "Default Node.js package manager",
          "enum": ["npm", "yarn", "pnpm"],
          "default": "npm"
        }
      },
      "additionalProperties": true
    },
    "registries": {
      "type": "object",
      "description": "Package registry URLs",
      "properties": {
        "npm": {
          "type": "string",
          "format": "uri",
          "description": "NPM registry URL",
          "examples": [
            "https://registry.npmjs.org",
            "https://npm.internal.company.com"
          ]
        },
        "pypi": {
          "type": "string",
          "format": "uri",
          "description": "PyPI index URL",
          "examples": [
            "https://pypi.org/simple",
            "https://pypi.internal.company.com/simple"
          ]
        },
        "maven": {
          "type": "string",
          "format": "uri",
          "description": "Maven repository URL",
          "examples": [
            "https://repo.maven.apache.org/maven2",
            "https://maven.internal.company.com"
          ]
        }
      },
      "additionalProperties": false
    },
    "profileDefaults": {
      "type": "object",
      "description": "Default options per profile",
      "properties": {
        "typescript-node": {
          "type": "object",
          "description": "Defaults for typescript-node profile",
          "additionalProperties": true
        },
        "angular-frontend": {
          "type": "object",
          "description": "Defaults for angular-frontend profile",
          "additionalProperties": true
        },
        "python-fastapi": {
          "type": "object",
          "description": "Defaults for python-fastapi profile",
          "additionalProperties": true
        },
        "java-spring-boot": {
          "type": "object",
          "description": "Defaults for java-spring-boot profile",
          "additionalProperties": true
        }
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false
}
```

### Schema Installation

To use the schema in your editor:

```json
{
  "$schema": "https://nix-devshell-mcp.example.com/config.schema.json",
  "author": "Your Name"
}
```

Or point to local schema file:

```json
{
  "$schema": "./node_modules/nix-devshell-mcp/config.schema.json",
  "author": "Your Name"
}
```

---

## Configuration Merge Logic

### Merge Algorithm

The configuration merge follows these rules:

1. **Top-level keys**: Shallow merge (later config overrides)
2. **Nested objects**: Deep merge (keys are merged recursively)
3. **Arrays**: Complete replacement (later array replaces earlier)
4. **Null/undefined**: Ignored (does not override existing values)

### Merge Examples

#### Example 1: Simple Override

```javascript
// System defaults
{ author: "System", nodeVersion: "18" }

// User config
{ author: "User", email: "user@example.com" }

// Result
{ author: "User", nodeVersion: "18", email: "user@example.com" }
```

#### Example 2: Nested Object Merge

```javascript
// User config
{
  defaults: { nodeVersion: "20" },
  registries: { npm: "https://npm1.com" }
}

// Project config
{
  defaults: { pythonVersion: "3.11" },
  registries: { pypi: "https://pypi1.com" }
}

// Result
{
  defaults: { nodeVersion: "20", pythonVersion: "3.11" },
  registries: { npm: "https://npm1.com", pypi: "https://pypi1.com" }
}
```

#### Example 3: Array Replacement

```javascript
// User config
{
  profileDefaults: {
    "typescript-node": {
      features: ["auth", "logging"]
    }
  }
}

// Project config
{
  profileDefaults: {
    "typescript-node": {
      features: ["caching"]
    }
  }
}

// Result (project array replaces user array)
{
  profileDefaults: {
    "typescript-node": {
      features: ["caching"]
    }
  }
}
```

#### Example 4: Full Example

```javascript
// 1. System defaults
{
  author: "Unknown",
  defaults: {
    nodeVersion: "18"
  }
}

// 2. Profile defaults (typescript-node)
{
  defaults: {
    nodeVersion: "20",
    framework: "express"
  }
}

// 3. User config
{
  author: "Jane Doe",
  email: "jane@example.com",
  defaults: {
    nodeVersion: "20",
    packageManager: "pnpm"
  },
  registries: {
    npm: "https://registry.npmjs.org"
  }
}

// 4. Project config
{
  defaults: {
    nodeVersion: "18"
  },
  registries: {
    npm: "https://npm.company.com"
  }
}

// 5. Tool options
{
  framework: "fastify"
}

// Final merged result
{
  author: "Jane Doe",
  email: "jane@example.com",
  defaults: {
    nodeVersion: "18",      // Project config wins
    framework: "fastify",   // Tool option wins
    packageManager: "pnpm"  // User config (no override)
  },
  registries: {
    npm: "https://npm.company.com"  // Project config wins
  }
}
```

### Implementation

```typescript
function mergeConfigs(
  system: Config,
  profile: Config,
  user: Config | null,
  project: Config | null,
  tool: Config
): MergedConfig {
  // Merge in priority order
  let result = deepClone(system);
  result = deepMerge(result, profile);
  if (user) result = deepMerge(result, user);
  if (project) result = deepMerge(result, project);
  result = deepMerge(result, tool);

  return result;
}

function deepMerge(target: any, source: any): any {
  if (!source) return target;
  if (!target) return deepClone(source);

  const result = deepClone(target);

  for (const [key, value] of Object.entries(source)) {
    // Skip null/undefined
    if (value === null || value === undefined) {
      continue;
    }

    // Arrays: replace completely
    if (Array.isArray(value)) {
      result[key] = deepClone(value);
      continue;
    }

    // Objects: deep merge
    if (typeof value === 'object' && !Array.isArray(value)) {
      result[key] = deepMerge(result[key] || {}, value);
      continue;
    }

    // Primitives: override
    result[key] = value;
  }

  return result;
}
```

---

## Example Configurations

### Minimal User Config

```json
{
  "author": "Your Name",
  "email": "you@example.com"
}
```

### Typical User Config

```json
{
  "author": "Jane Developer",
  "email": "jane@example.com",
  "organization": "Acme Corp",
  "defaults": {
    "nodeVersion": "20",
    "pythonVersion": "3.11",
    "packageManager": "pnpm"
  }
}
```

### Enterprise User Config

```json
{
  "author": "John Smith",
  "email": "john.smith@company.com",
  "organization": "Enterprise Corp",
  "defaults": {
    "nodeVersion": "20",
    "pythonVersion": "3.11",
    "javaVersion": "21",
    "packageManager": "npm"
  },
  "registries": {
    "npm": "https://npm.internal.company.com",
    "pypi": "https://pypi.internal.company.com/simple",
    "maven": "https://maven.internal.company.com"
  },
  "profileDefaults": {
    "typescript-node": {
      "framework": "express",
      "includeDatabase": false
    },
    "python-fastapi": {
      "dependencyManager": "poetry",
      "includeAlembic": true
    },
    "java-spring-boot": {
      "buildTool": "maven",
      "includeSecurity": true
    }
  }
}
```

### Team Project Config

```json
{
  "defaults": {
    "nodeVersion": "20"
  },
  "registries": {
    "npm": "https://npm.internal.company.com"
  },
  "profileDefaults": {
    "typescript-node": {
      "framework": "express",
      "includeDatabase": true,
      "databaseType": "postgresql"
    }
  }
}
```

### Open Source Project Config

```json
{
  "organization": "MyOpenSourceProject",
  "defaults": {
    "nodeVersion": "20",
    "pythonVersion": "3.11"
  }
}
```

---

## Environment Variables

### Configuration Values from Environment

Both user and project configs can reference environment variables using `${VAR_NAME}` syntax:

```json
{
  "registries": {
    "npm": "${NPM_REGISTRY_URL}",
    "pypi": "${PYPI_INDEX_URL}"
  },
  "author": "${GIT_AUTHOR_NAME}",
  "email": "${GIT_AUTHOR_EMAIL}"
}
```

### Resolution

Environment variables are resolved at runtime:

```typescript
function resolveEnvVars(config: any): any {
  const envVarPattern = /\$\{([^}]+)\}/g;

  return JSON.parse(
    JSON.stringify(config),
    (key, value) => {
      if (typeof value === 'string') {
        return value.replace(envVarPattern, (match, varName) => {
          const envValue = process.env[varName];
          if (envValue === undefined) {
            console.warn(`Environment variable ${varName} not found, using placeholder`);
            return match;
          }
          return envValue;
        });
      }
      return value;
    }
  );
}
```

### Common Environment Variables

```bash
# Git defaults
GIT_AUTHOR_NAME="Your Name"
GIT_AUTHOR_EMAIL="you@example.com"

# Registry URLs
NPM_REGISTRY_URL="https://registry.npmjs.org"
PYPI_INDEX_URL="https://pypi.org/simple"
MAVEN_REPOSITORY_URL="https://repo.maven.apache.org/maven2"

# Auth tokens (use with caution, prefer .npmrc, etc.)
NPM_TOKEN="npm_xxx"
PYPI_TOKEN="pypi-xxx"
```

### Security Note

**Never commit authentication tokens to version control**. Use:
- `.npmrc` for npm authentication
- `.pypirc` for PyPI authentication
- `settings.xml` for Maven authentication

---

## Validation Rules

### Schema Validation

All configuration files are validated against the JSON schema using AJV.

### Validation Implementation

```typescript
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import configSchema from './config.schema.json';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const validate = ajv.compile(configSchema);

function validateConfig(config: unknown): void {
  const valid = validate(config);

  if (!valid) {
    const errors = validate.errors!.map(err => {
      return `${err.instancePath} ${err.message}`;
    });

    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}
```

### Common Validation Errors

#### Invalid Email Format

```json
{
  "email": "not-an-email"
}
```

**Error**: `/email must match format "email"`

**Fix**: Use a valid email address

#### Invalid Version Enum

```json
{
  "defaults": {
    "nodeVersion": "19"
  }
}
```

**Error**: `/defaults/nodeVersion must be equal to one of the allowed values: 18, 20, 22`

**Fix**: Use an allowed version

#### Invalid URL Format

```json
{
  "registries": {
    "npm": "not a url"
  }
}
```

**Error**: `/registries/npm must match format "uri"`

**Fix**: Use a valid URL

#### Unknown Properties

```json
{
  "unknownKey": "value"
}
```

**Error**: `must NOT have additional properties`

**Fix**: Remove unknown properties or check spelling

### Custom Validation Rules

Beyond JSON schema validation:

1. **Registry Reachability** (Optional): Warn if registry URLs are unreachable
2. **Profile Existence**: Validate that profiles in `profileDefaults` exist
3. **Version Compatibility**: Ensure version combinations are compatible

### Validation Examples

```typescript
// Valid configurations
const valid1 = {
  author: "Test",
  defaults: { nodeVersion: "20" }
};

const valid2 = {
  email: "test@example.com",
  registries: { npm: "https://registry.npmjs.org" }
};

// Invalid configurations
const invalid1 = {
  email: "invalid-email"  // Fails format validation
};

const invalid2 = {
  defaults: { nodeVersion: "19" }  // Not in enum
};

const invalid3 = {
  unknownKey: "value"  // Additional property not allowed
};
```

---

## Configuration Best Practices

### For Individual Developers

1. **Keep user config minimal**: Only set personal preferences
2. **Use environment variables**: For sensitive values like tokens
3. **Don't commit user config**: Keep it local to your machine

### For Teams

1. **Commit project config**: Share team settings via version control
2. **Document required variables**: If using env vars, document them
3. **Use consistent versions**: Standardize Node/Python/Java versions
4. **Configure registries**: Set up internal registries in project config

### For Enterprises

1. **Provide default user config**: Give new developers a template
2. **Document configuration**: Explain required and optional settings
3. **Validate configurations**: Use schema validation in CI/CD
4. **Secure registries**: Use authenticated private registries

---

## Configuration Discovery

### Config File Locations

The server looks for configurations in this order:

1. **User config**:
   - Linux/macOS: `~/.config/nix-devshell-mcp/config.json`
   - Windows: `%APPDATA%\nix-devshell-mcp\config.json`

2. **Project config**:
   - Relative to project path: `./devshell-config.json`
   - Checked before project creation

### Discovery Algorithm

```typescript
async function discoverConfigs(projectPath: string): Promise<Configs> {
  // 1. Look for user config
  const userConfigPath = getUserConfigPath();
  const userConfig = await loadConfigIfExists(userConfigPath);

  // 2. Look for project config
  const projectConfigPath = path.join(projectPath, 'devshell-config.json');
  const projectConfig = await loadConfigIfExists(projectConfigPath);

  return { userConfig, projectConfig };
}

function getUserConfigPath(): string {
  const configHome = process.env.XDG_CONFIG_HOME ||
    path.join(os.homedir(), '.config');

  return path.join(configHome, 'nix-devshell-mcp', 'config.json');
}
```

---

## Troubleshooting

### Configuration Not Loading

**Issue**: Changes to config files not taking effect

**Solution**:
1. Verify file location is correct
2. Check JSON syntax (use JSON validator)
3. Ensure file has correct permissions
4. Check MCP server logs for errors

### Validation Errors

**Issue**: Server rejects configuration file

**Solution**:
1. Validate against JSON schema
2. Check for typos in property names
3. Verify value types (string vs number)
4. Remove additional properties not in schema

### Environment Variables Not Resolving

**Issue**: `${VAR_NAME}` appearing in generated files

**Solution**:
1. Ensure environment variable is set before running
2. Check variable name spelling
3. Export variable in shell: `export VAR_NAME=value`
4. Restart IDE/terminal after setting variables

### Priority Issues

**Issue**: Wrong config taking precedence

**Solution**:
1. Review priority order (tool > project > user > profile > system)
2. Check project config in target directory
3. Verify tool options being passed
4. Use debug logging to see merged config

---

## Appendix: Complete Schema File

**File**: `config.schema.json`

Save this file to enable IDE autocomplete and validation:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://nix-devshell-mcp.example.com/config.schema.json",
  "title": "nix-devshell-mcp Configuration",
  "description": "Configuration schema for nix-devshell-mcp server",
  "type": "object",
  "properties": {
    "author": {
      "type": "string",
      "description": "Default author name for generated projects"
    },
    "email": {
      "type": "string",
      "format": "email",
      "description": "Default author email for generated projects"
    },
    "organization": {
      "type": "string",
      "description": "Organization or company name"
    },
    "defaults": {
      "type": "object",
      "properties": {
        "nodeVersion": {
          "type": "string",
          "enum": ["18", "20", "22"],
          "default": "20"
        },
        "pythonVersion": {
          "type": "string",
          "enum": ["3.10", "3.11", "3.12"],
          "default": "3.11"
        },
        "javaVersion": {
          "type": "string",
          "enum": ["17", "21"],
          "default": "21"
        },
        "packageManager": {
          "type": "string",
          "enum": ["npm", "yarn", "pnpm"],
          "default": "npm"
        }
      },
      "additionalProperties": true
    },
    "registries": {
      "type": "object",
      "properties": {
        "npm": {
          "type": "string",
          "format": "uri"
        },
        "pypi": {
          "type": "string",
          "format": "uri"
        },
        "maven": {
          "type": "string",
          "format": "uri"
        }
      },
      "additionalProperties": false
    },
    "profileDefaults": {
      "type": "object",
      "properties": {
        "typescript-node": {
          "type": "object",
          "additionalProperties": true
        },
        "angular-frontend": {
          "type": "object",
          "additionalProperties": true
        },
        "python-fastapi": {
          "type": "object",
          "additionalProperties": true
        },
        "java-spring-boot": {
          "type": "object",
          "additionalProperties": true
        }
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false
}
```

---

**Document Owner**: Configuration Team
**Review Cycle**: Every release
**Next Review**: Before v1.1.0