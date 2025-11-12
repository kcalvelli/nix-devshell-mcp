# Implementation Plan

**Project**: nix-devshell-mcp
**Version**: 1.0.0
**Total Estimated Time**: 23-31 hours
**Last Updated**: 2025-11-12

---

## Table of Contents

1. [Overview](#overview)
2. [Phase 1: Project Setup](#phase-1-project-setup)
3. [Phase 2: Core Utilities](#phase-2-core-utilities)
4. [Phase 3: Profile System](#phase-3-profile-system)
5. [Phase 4: Template Engine](#phase-4-template-engine)
6. [Phase 5: MCP Tools](#phase-5-mcp-tools)
7. [Phase 6: Profile Templates](#phase-6-profile-templates)
8. [Phase 7: Testing & Validation](#phase-7-testing--validation)
9. [Phase 8: Documentation & Polish](#phase-8-documentation--polish)
10. [Phase 9: Release Preparation](#phase-9-release-preparation)

---

## Overview

### Implementation Strategy

This implementation plan follows a bottom-up approach:

1. **Foundation First**: Set up project structure and utilities
2. **Core Components**: Build essential services (config, filesystem, validation)
3. **Profile System**: Implement profile loading and management
4. **Template Engine**: Add Handlebars rendering with helpers
5. **MCP Integration**: Implement MCP tools and server
6. **Templates**: Create all 4 profile templates
7. **Testing**: Add comprehensive test coverage
8. **Polish**: Documentation, examples, and refinements
9. **Release**: Prepare for distribution

### Timeline

- **Minimum**: 23 hours (experienced developer, no blockers)
- **Expected**: 27 hours (average pace with some debugging)
- **Maximum**: 31 hours (includes learning curve and challenges)

### Prerequisites

Before starting:
- [x] Read all specification documents
- [x] Understand MCP protocol
- [x] Familiarize with Nix flakes
- [x] Set up development environment (Node.js 18+, TypeScript)

---

## Phase 1: Project Setup

**Goal**: Initialize project with TypeScript, dependencies, and basic structure

**Duration**: 2-3 hours

### Step 1.1: Initialize Project

```bash
# Create project directory
mkdir nix-devshell-mcp
cd nix-devshell-mcp

# Initialize npm project
npm init -y

# Initialize git
git init
```

### Step 1.2: Install Dependencies

```bash
# Production dependencies
npm install @modelcontextprotocol/sdk handlebars ajv

# Development dependencies
npm install -D typescript @types/node @types/handlebars vitest tsx
npm install -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser
npm install -D prettier
```

### Step 1.3: Configure TypeScript

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "outDir": "./build",
    "rootDir": "./src",
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "types": ["node"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "build", "tests"]
}
```

### Step 1.4: Configure Package Scripts

Update `package.json`:

```json
{
  "name": "nix-devshell-mcp",
  "version": "1.0.0",
  "description": "MCP server for generating Nix flake development environments",
  "main": "build/index.js",
  "type": "module",
  "bin": {
    "nix-devshell-mcp": "build/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsx watch src/index.ts",
    "start": "node build/index.js",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "format": "prettier --write \"src/**/*.ts\""
  },
  "keywords": ["mcp", "nix", "devshell", "flake"],
  "author": "",
  "license": "MIT"
}
```

### Step 1.5: Create Directory Structure

```bash
mkdir -p src/{config,fs,profiles,renderer,tools,validation,executor}
mkdir -p tests/{unit,integration,fixtures}
mkdir -p profiles/{typescript-node,angular-frontend,python-fastapi,java-spring-boot}
```

### Step 1.6: Create Initial Files

**src/index.ts**:
```typescript
#!/usr/bin/env node

console.log('nix-devshell-mcp starting...');

async function main() {
  // TODO: Implement MCP server
}

main().catch(console.error);
```

Make it executable:
```bash
chmod +x src/index.ts
```

**src/types.ts**:
```typescript
// Common types used across the project

export interface ProjectInfo {
  name: string;
  path: string;
}

export interface ProfileMetadata {
  name: string;
  displayName: string;
  description: string;
  version: string;
  supportedOptions: ProfileOption[];
  tags: string[];
  examples: string[];
}

export interface ProfileOption {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  description: string;
  required: boolean;
  default?: unknown;
  enum?: string[];
}

// Add more types as needed
```

### Step 1.7: Configure ESLint and Prettier

**.eslintrc.json**:
```json
{
  "parser": "@typescript-eslint/parser",
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module"
  },
  "env": {
    "node": true,
    "es2022": true
  },
  "rules": {
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

**.prettierrc**:
```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

### Step 1.8: Create .gitignore

```
node_modules/
build/
dist/
.env
*.log
.DS_Store
result
result-*
.direnv/
coverage/
```

### Verification

```bash
# Build should succeed
npm run build

# Linting should pass
npm run lint

# Tests should run (even if empty)
npm test
```

**Checkpoint**: ✓ Project structure set up and ready for development

---

## Phase 2: Core Utilities

**Goal**: Implement foundational utilities (config, filesystem, validation)

**Duration**: 4-5 hours

### Step 2.1: Filesystem Manager

**File**: `src/fs/FilesystemManager.ts`

Implement all methods from TECHNICAL_SPEC.md:
- `ensureDirectory()`
- `fileExists()`
- `writeFile()`
- `safeWrite()`
- `makeExecutable()`
- `validatePath()` (private)

Key features:
- Path traversal protection
- Atomic writes
- Skip existing files
- Proper error handling

### Step 2.2: Configuration Manager

**File**: `src/config/ConfigManager.ts`

Implement:
- `loadUserConfig()`
- `loadProjectConfig()`
- `mergeConfigs()`
- `validateConfig()`
- `getUserConfigPath()` (private)

Features:
- Environment variable resolution
- Deep merge logic
- JSON schema validation

### Step 2.3: Validator

**File**: `src/validation/Validator.ts`

Implement:
- `validateToolInput()`
- `validateConfig()`
- `validateProfileOptions()`

Use AJV for schema validation.

### Step 2.4: Logger

**File**: `src/utils/logger.ts`

Simple logger with levels:
```typescript
export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

class Logger {
  private level: LogLevel;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;
  }

  error(message: string, ...args: any[]) {
    console.error(`[ERROR] ${message}`, ...args);
  }

  warn(message: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  debug(message: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    return levels.indexOf(level) <= levels.indexOf(this.level);
  }
}

export const logger = new Logger();
```

### Step 2.5: Error Definitions

**File**: `src/utils/errors.ts`

```typescript
export enum ErrorCode {
  INVALID_INPUT = 'INVALID_INPUT',
  PROFILE_NOT_FOUND = 'PROFILE_NOT_FOUND',
  INVALID_OPTIONS = 'INVALID_OPTIONS',
  INVALID_PATH = 'INVALID_PATH',
  INVALID_CONFIG = 'INVALID_CONFIG',
  FILESYSTEM_ERROR = 'FILESYSTEM_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  TEMPLATE_ERROR = 'TEMPLATE_ERROR',
  RENDER_ERROR = 'RENDER_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export class McpError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'McpError';
  }
}
```

### Step 2.6: Write Unit Tests

Uncomment and implement tests from TEST_SPEC.md:
- `tests/unit/fs/FilesystemManager.test.ts`
- `tests/unit/config/ConfigManager.test.ts`
- `tests/unit/validation/Validator.test.ts`

Run tests:
```bash
npm test -- --watch
```

### Verification

- All utility functions work correctly
- Tests pass
- Error handling is robust
- No lint errors

**Checkpoint**: ✓ Core utilities implemented and tested

---

## Phase 3: Profile System

**Goal**: Implement profile loading and management

**Duration**: 3-4 hours

### Step 3.1: Profile Manager

**File**: `src/profiles/ProfileManager.ts`

Implement:
- `listProfiles()`: Scan profiles/ directory
- `loadProfile()`: Load profile.json and templates
- `validateProfile()`: Ensure profile is complete
- `getProfilePath()`: Helper method

### Step 3.2: Profile Types

Update `src/types.ts` with profile structures from TECHNICAL_SPEC.md:

```typescript
export interface Profile {
  metadata: ProfileMetadata;
  templates: ProfileTemplates;
  defaults: Record<string, unknown>;
}

export interface ProfileTemplates {
  flake: string;
  scaffold: ScaffoldFile[];
  static: StaticFile[];
  hooks: HookFile[];
}

// ... other types
```

### Step 3.3: Create Test Profile

Create a minimal test profile for development:

**profiles/test-profile/profile.json**:
```json
{
  "name": "test-profile",
  "displayName": "Test Profile",
  "description": "Simple profile for testing",
  "version": "1.0.0",
  "supportedOptions": [],
  "tags": ["test"],
  "examples": [],
  "defaults": {}
}
```

**profiles/test-profile/flake.nix.hbs**:
```nix
{
  description = "{{project.name}} test";
  outputs = { self, nixpkgs }: {};
}
```

**profiles/test-profile/.envrc**:
```
use flake
```

### Step 3.4: Profile Discovery

Implement profile scanning:

```typescript
async function scanProfiles(): Promise<string[]> {
  const profilesDir = path.join(__dirname, '../../profiles');
  const entries = await fs.readdir(profilesDir, { withFileTypes: true });

  return entries
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);
}
```

### Step 3.5: Write Tests

Implement:
- `tests/unit/profiles/ProfileManager.test.ts`

### Verification

```bash
# Profile loading works
npm test tests/unit/profiles

# Can list profiles
node -e "import('./build/profiles/ProfileManager.js').then(m => m.ProfileManager.prototype.listProfiles()).then(console.log)"
```

**Checkpoint**: ✓ Profile system functional

---

## Phase 4: Template Engine

**Goal**: Implement Handlebars template rendering with custom helpers

**Duration**: 3-4 hours

### Step 4.1: Renderer Implementation

**File**: `src/renderer/Renderer.ts`

Implement:
- `renderTemplate()`: Render a single template file
- `renderProfile()`: Render all templates in a profile
- `registerHelper()`: Register custom Handlebars helpers

### Step 4.2: Custom Handlebars Helpers

**File**: `src/renderer/helpers.ts`

Implement all helpers from TECHNICAL_SPEC.md:
- `json`: Serialize to JSON
- `if_eq`: Equality comparison
- `if_includes`: Array includes check
- `lowercase`: Convert to lowercase
- `uppercase`: Convert to uppercase
- `year`: Current year

Register helpers:
```typescript
import Handlebars from 'handlebars';
import { registerHelpers } from './helpers';

export class Renderer {
  private handlebars: typeof Handlebars;

  constructor() {
    this.handlebars = Handlebars.create();
    registerHelpers(this.handlebars);
  }

  // ... methods
}
```

### Step 4.3: Render Context Builder

**File**: `src/renderer/context.ts`

```typescript
import { Profile, MergedConfig } from '../types';

export interface RenderContext {
  project: {
    name: string;
    path: string;
  };
  profile: {
    name: string;
    version: string;
  };
  options: Record<string, unknown>;
  config: MergedConfig;
  metadata: {
    generatedAt: string;
    generatedBy: string;
  };
}

export function buildRenderContext(
  projectPath: string,
  profile: Profile,
  config: MergedConfig,
  options: Record<string, unknown>
): RenderContext {
  const projectName = path.basename(projectPath);

  return {
    project: {
      name: projectName,
      path: projectPath,
    },
    profile: {
      name: profile.metadata.name,
      version: profile.metadata.version,
    },
    options,
    config,
    metadata: {
      generatedAt: new Date().toISOString(),
      generatedBy: 'nix-devshell-mcp',
    },
  };
}
```

### Step 4.4: Template Compilation

Implement template compilation with caching:

```typescript
private templateCache = new Map<string, HandlebarsTemplateDelegate>();

async renderTemplate(templatePath: string, context: any): Promise<string> {
  let template = this.templateCache.get(templatePath);

  if (!template) {
    const source = await fs.readFile(templatePath, 'utf-8');
    template = this.handlebars.compile(source);
    this.templateCache.set(templatePath, template);
  }

  return template(context);
}
```

### Step 4.5: Write Tests

Implement:
- `tests/unit/renderer/Renderer.test.ts`
- `tests/unit/renderer/handlebarsHelpers.test.ts`

Test all custom helpers.

### Verification

```bash
# All renderer tests pass
npm test tests/unit/renderer

# Can render simple template
echo "Hello {{name}}!" > /tmp/test.hbs
node -e "import('./build/renderer/Renderer.js').then(m => new m.Renderer().renderTemplate('/tmp/test.hbs', {name:'World'}).then(console.log))"
```

**Checkpoint**: ✓ Template engine working

---

## Phase 5: MCP Tools

**Goal**: Implement MCP server and tools

**Duration**: 4-5 hours

### Step 5.1: Executor for Hooks

**File**: `src/executor/Executor.ts`

Implement hook execution:
```typescript
import { spawn } from 'child_process';

export interface ExecutionResult {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
}

export class Executor {
  async executeHook(
    hookPath: string,
    workingDir: string,
    env?: Record<string, string>
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    return new Promise((resolve) => {
      const proc = spawn(hookPath, [workingDir], {
        cwd: workingDir,
        env: { ...process.env, ...env },
        timeout: 30000, // 30 seconds
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        const duration = Date.now() - startTime;

        resolve({
          success: code === 0,
          exitCode: code || 0,
          stdout,
          stderr,
          duration,
        });
      });
    });
  }
}
```

### Step 5.2: create_devshell Tool

**File**: `src/tools/createDevshell.ts`

Implement the main tool:

```typescript
import { ProfileManager } from '../profiles/ProfileManager';
import { ConfigManager } from '../config/ConfigManager';
import { Renderer } from '../renderer/Renderer';
import { FilesystemManager } from '../fs/FilesystemManager';
import { Executor } from '../executor/Executor';
import { Validator } from '../validation/Validator';

export interface CreateDevshellInput {
  projectPath: string;
  profile: string;
  options?: Record<string, unknown>;
}

export interface CreateDevshellResult {
  success: boolean;
  message: string;
  filesCreated: string[];
  filesSkipped: string[];
  projectPath: string;
  nextSteps: string[];
}

export async function createDevshell(
  input: CreateDevshellInput
): Promise<CreateDevshellResult> {
  // 1. Validate input
  const validator = new Validator();
  validator.validateToolInput('create_devshell', input);

  // 2. Load profile
  const profileManager = new ProfileManager();
  const profile = await profileManager.loadProfile(input.profile);

  // 3. Load and merge configs
  const configManager = new ConfigManager();
  const userConfig = await configManager.loadUserConfig();
  const projectConfig = await configManager.loadProjectConfig(input.projectPath);
  const mergedConfig = configManager.mergeConfigs(
    userConfig,
    projectConfig,
    input.options || {},
    profile.defaults
  );

  // 4. Build render context
  const context = buildRenderContext(input.projectPath, profile, mergedConfig, input.options || {});

  // 5. Render templates
  const renderer = new Renderer();
  const renderedFiles = await renderer.renderProfile(profile, context);

  // 6. Write files
  const fsManager = new FilesystemManager();
  await fsManager.ensureDirectory(input.projectPath);

  const filesCreated: string[] = [];
  const filesSkipped: string[] = [];

  for (const [filePath, content] of Object.entries(renderedFiles)) {
    const fullPath = path.join(input.projectPath, filePath);
    const result = await fsManager.safeWrite(fullPath, content, { skipIfExists: true });

    if (result.written) {
      filesCreated.push(filePath);
    } else {
      filesSkipped.push(filePath);
    }
  }

  // 7. Execute post-create hooks
  const executor = new Executor();
  for (const hook of profile.templates.hooks) {
    const hookPath = path.join(input.projectPath, hook.source);
    await fsManager.makeExecutable(hookPath);
    await executor.executeHook(hookPath, input.projectPath);
  }

  // 8. Return result
  return {
    success: true,
    message: `Project created successfully at ${input.projectPath}`,
    filesCreated,
    filesSkipped,
    projectPath: path.resolve(input.projectPath),
    nextSteps: [
      `cd ${input.projectPath}`,
      'direnv allow',
      // Add more based on profile
    ],
  };
}
```

### Step 5.3: list_profiles Tool

**File**: `src/tools/listProfiles.ts`

```typescript
import { ProfileManager } from '../profiles/ProfileManager';
import { ProfileMetadata } from '../types';

export interface ListProfilesResult {
  profiles: ProfileMetadata[];
}

export async function listProfiles(): Promise<ListProfilesResult> {
  const profileManager = new ProfileManager();
  const profiles = await profileManager.listProfiles();

  return { profiles };
}
```

### Step 5.4: MCP Server

**File**: `src/index.ts`

```typescript
#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { createDevshell } from './tools/createDevshell.js';
import { listProfiles } from './tools/listProfiles.js';
import { logger } from './utils/logger.js';
import { McpError } from './utils/errors.js';

const server = new Server(
  {
    name: 'nix-devshell-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'create_devshell',
        description: 'Create a new Nix flake development environment from a template profile',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: {
              type: 'string',
              description: 'Path where the project should be created',
            },
            profile: {
              type: 'string',
              enum: ['typescript-node', 'angular-frontend', 'python-fastapi', 'java-spring-boot'],
              description: 'Template profile to use',
            },
            options: {
              type: 'object',
              description: 'Profile-specific configuration options',
            },
          },
          required: ['projectPath', 'profile'],
        },
      },
      {
        name: 'list_profiles',
        description: 'List all available project template profiles',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (request.params.name === 'create_devshell') {
      const result = await createDevshell(request.params.arguments as any);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result),
          },
        ],
      };
    } else if (request.params.name === 'list_profiles') {
      const result = await listProfiles();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result),
          },
        ],
      };
    } else {
      throw new Error(`Unknown tool: ${request.params.name}`);
    }
  } catch (error) {
    logger.error('Tool execution failed:', error);

    if (error instanceof McpError) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: {
                code: error.code,
                message: error.message,
                details: error.details,
              },
            }),
          },
        ],
        isError: true,
      };
    }

    throw error;
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('nix-devshell-mcp server started');
}

main().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});
```

### Step 5.5: Write Tests

Implement:
- `tests/unit/executor/Executor.test.ts`
- `tests/integration/createDevshell.test.ts`
- `tests/integration/listProfiles.test.ts`

### Verification

```bash
# Build and test
npm run build
npm test

# Test MCP server manually
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node build/index.js
```

**Checkpoint**: ✓ MCP server and tools implemented

---

## Phase 6: Profile Templates

**Goal**: Create all 4 production profile templates

**Duration**: 6-8 hours

### Step 6.1: TypeScript Node Profile

Copy all files from TEMPLATE_SPEC.md for typescript-node:

```bash
# Create directory structure
mkdir -p profiles/typescript-node/{hooks,scaffold/src,scaffold/tests}

# Create all template files
# - profile.json
# - flake.nix.hbs
# - .envrc
# - hooks/post-create.sh (chmod +x)
# - scaffold/* (all files from TEMPLATE_SPEC.md)
```

Test the profile:
```bash
npm run build
node build/index.js # Test via MCP or direct tool import
```

### Step 6.2: Angular Frontend Profile

Repeat for angular-frontend profile with all files from TEMPLATE_SPEC.md.

### Step 6.3: Python FastAPI Profile

Repeat for python-fastapi profile.

### Step 6.4: Java Spring Boot Profile

Repeat for java-spring-boot profile.

### Step 6.5: Validate All Profiles

Create validation script:

**scripts/validate-profiles.ts**:
```typescript
import { ProfileManager } from '../src/profiles/ProfileManager';

async function validateProfiles() {
  const manager = new ProfileManager();
  const profiles = await manager.listProfiles();

  console.log(`Found ${profiles.length} profiles:`);

  for (const profile of profiles) {
    console.log(`\n✓ ${profile.displayName} (${profile.name})`);
    console.log(`  Version: ${profile.version}`);
    console.log(`  Options: ${profile.supportedOptions.length}`);

    // Load and validate
    const full = await manager.loadProfile(profile.name);
    await manager.validateProfile(full);

    console.log(`  ✓ Validated`);
  }
}

validateProfiles().catch(console.error);
```

Run:
```bash
npm run build && node build/../scripts/validate-profiles.js
```

### Verification

- All 4 profiles load without errors
- All templates compile
- post-create.sh hooks are executable
- Profile metadata is complete

**Checkpoint**: ✓ All profile templates created

---

## Phase 7: Testing & Validation

**Goal**: Achieve 80%+ test coverage

**Duration**: 4-5 hours

### Step 7.1: Complete Unit Tests

Uncomment and complete all unit tests from TEST_SPEC.md:
- Config tests
- Renderer tests
- Filesystem tests
- Validator tests
- Profile tests

### Step 7.2: Integration Tests

Implement full integration tests:
- Create projects with all 4 profiles
- Test configuration overrides
- Test file skipping
- Test git initialization

### Step 7.3: Manual Testing

Test with real Nix environment:

```bash
# Build
npm run build

# Test typescript-node profile
mkdir -p /tmp/test-ts
node -e "import('./build/tools/createDevshell.js').then(m => m.createDevshell({projectPath:'/tmp/test-ts',profile:'typescript-node'})).then(console.log)"

# Verify with Nix
cd /tmp/test-ts
nix flake check
direnv allow
npm install
npm run dev
```

Repeat for all profiles.

### Step 7.4: Coverage Report

```bash
npm run test:coverage
```

Review coverage report in `coverage/index.html`.

Target: ≥80% line coverage.

### Verification

- All tests pass
- Coverage target met
- Manual tests successful
- No critical bugs

**Checkpoint**: ✓ Tests complete and passing

---

## Phase 8: Documentation & Polish

**Goal**: Finalize documentation and polish UX

**Duration**: 2-3 hours

### Step 8.1: Update README

Ensure README.md is complete and accurate.

### Step 8.2: Add Usage Examples

**examples/basic-usage.md**:
```markdown
# Basic Usage Examples

## TypeScript Node.js Project

\`\`\`bash
# Via Claude Desktop
User: "Create a TypeScript Node.js project called 'my-api'"

# Direct MCP call
{
  "tool": "create_devshell",
  "arguments": {
    "projectPath": "./my-api",
    "profile": "typescript-node"
  }
}
\`\`\`

# ... more examples
```

### Step 8.3: Configuration Guide

**docs/CONFIGURATION.md** (or update CONFIG_SCHEMA.md):
- Add step-by-step setup guide
- Common configuration patterns
- Troubleshooting section

### Step 8.4: CLI Help

Add `--help` flag support (optional for MVP):

```typescript
if (process.argv.includes('--help')) {
  console.log(`
nix-devshell-mcp - MCP server for Nix flake development environments

Usage:
  nix-devshell-mcp                Start MCP server on stdio
  nix-devshell-mcp --help         Show this help
  nix-devshell-mcp --version      Show version

For usage with Claude Desktop, add to config:
  ~/.config/Claude/claude_desktop_config.json

Documentation: https://github.com/your-org/nix-devshell-mcp
  `);
  process.exit(0);
}
```

### Step 8.5: Error Messages

Review all error messages for clarity:
- User-friendly language
- Actionable suggestions
- Include context

### Step 8.6: Polish

- Fix any lint warnings
- Ensure consistent code style
- Add TSDoc comments to public APIs
- Remove debug console.logs

### Verification

- Documentation is clear and complete
- Examples work as documented
- Error messages are helpful
- Code is clean and consistent

**Checkpoint**: ✓ Documentation and polish complete

---

## Phase 9: Release Preparation

**Goal**: Prepare for release and distribution

**Duration**: 1-2 hours

### Step 9.1: Version and Changelog

**CHANGELOG.md**:
```markdown
# Changelog

## [1.0.0] - 2025-11-12

### Added
- Initial release
- MCP server with create_devshell and list_profiles tools
- Four production profiles: typescript-node, angular-frontend, python-fastapi, java-spring-boot
- User and project configuration support
- Private registry support (npm, PyPI, Maven)
- Comprehensive test suite (80%+ coverage)

### Features
- Non-destructive file generation
- Git repository initialization
- Handlebars templating with custom helpers
- JSON schema validation
```

### Step 9.2: Package Metadata

Update `package.json`:
```json
{
  "name": "nix-devshell-mcp",
  "version": "1.0.0",
  "description": "MCP server for generating Nix flake development environments",
  "keywords": ["mcp", "nix", "flake", "devshell", "nix-flakes"],
  "homepage": "https://github.com/your-org/nix-devshell-mcp",
  "bugs": "https://github.com/your-org/nix-devshell-mcp/issues",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/nix-devshell-mcp.git"
  },
  "author": "Your Name <you@example.com>",
  "license": "MIT",
  "files": [
    "build/",
    "profiles/",
    "README.md",
    "LICENSE"
  ]
}
```

### Step 9.3: License

Add LICENSE file (MIT or your choice):

```
MIT License

Copyright (c) 2025 [Your Name]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

### Step 9.4: CI/CD Setup

**.github/workflows/test.yml**:
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: npm test
      - run: npm run test:coverage

      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

### Step 9.5: Pre-Release Checklist

- [ ] All tests pass
- [ ] Documentation is complete
- [ ] README has clear installation instructions
- [ ] CHANGELOG is up to date
- [ ] Version number is correct
- [ ] License file exists
- [ ] No sensitive data in repository
- [ ] .gitignore is complete
- [ ] package.json metadata is accurate

### Step 9.6: Build and Test Package

```bash
# Clean build
rm -rf build node_modules
npm install
npm run build

# Test installation
npm pack
npm install -g ./nix-devshell-mcp-1.0.0.tgz

# Test installed package
nix-devshell-mcp --version
```

### Step 9.7: Publish (Optional)

```bash
# Test publish (dry run)
npm publish --dry-run

# Actual publish
npm publish
```

### Verification

- Package builds cleanly
- Installation works
- CLI command is available
- MCP server starts correctly

**Checkpoint**: ✓ Ready for release!

---

## Post-Implementation

### Next Steps After MVP

1. **Gather Feedback**: Use the tool, get user feedback
2. **Bug Fixes**: Address any issues found in real usage
3. **Performance**: Profile and optimize hot paths
4. **Additional Profiles**: Add rust, go, react, etc.
5. **Advanced Features**: Custom profiles, template hot-reload, etc.

### Maintenance

- Keep dependencies updated
- Monitor issues and questions
- Update templates as frameworks evolve
- Add new profiles based on demand

---

## Troubleshooting Guide

### Common Issues During Implementation

#### TypeScript Compilation Errors

**Issue**: `Cannot find module` errors

**Solution**:
- Check tsconfig.json paths
- Ensure all imports use `.js` extensions
- Verify `"type": "module"` in package.json

#### MCP Server Not Starting

**Issue**: Server exits immediately

**Solution**:
- Check for uncaught exceptions
- Add try/catch to main()
- Verify stdio transport setup
- Check logs in stderr

#### Template Rendering Fails

**Issue**: Handlebars syntax errors

**Solution**:
- Validate template syntax
- Check helper registrations
- Ensure context has required data
- Use try/catch in renderTemplate

#### Tests Failing

**Issue**: Filesystem tests fail

**Solution**:
- Use temp directories for tests
- Clean up after each test
- Mock filesystem where appropriate
- Check file permissions

#### Profile Not Found

**Issue**: Profile loading fails

**Solution**:
- Verify profiles/ directory structure
- Check profile.json syntax
- Ensure profile name matches directory
- Use absolute paths in ProfileManager

---

## Tips for Success

1. **Follow the Order**: Complete phases sequentially
2. **Test Early**: Write tests as you implement
3. **Commit Often**: Small, focused commits
4. **Use Specifications**: Reference spec documents frequently
5. **Ask for Help**: Don't get stuck, consult documentation
6. **Take Breaks**: Fresh perspective helps debug
7. **Manual Testing**: Test with real Nix environment regularly
8. **Code Review**: Review your own code before moving on

---

## Timeline Summary

| Phase | Task | Hours |
|-------|------|-------|
| 1 | Project Setup | 2-3 |
| 2 | Core Utilities | 4-5 |
| 3 | Profile System | 3-4 |
| 4 | Template Engine | 3-4 |
| 5 | MCP Tools | 4-5 |
| 6 | Profile Templates | 6-8 |
| 7 | Testing & Validation | 4-5 |
| 8 | Documentation & Polish | 2-3 |
| 9 | Release Preparation | 1-2 |
| **Total** | | **29-39** |

Realistic estimate: **23-31 hours** for experienced developer

---

**Document Owner**: Development Team
**Review Cycle**: After each phase
**Next Review**: Phase 1 completion

---

**Good luck with the implementation! 🚀**