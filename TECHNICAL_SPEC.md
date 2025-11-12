# Technical Specification

**Project**: nix-devshell-mcp
**Version**: 1.0.0
**Last Updated**: 2025-11-12

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Component Breakdown](#component-breakdown)
3. [Data Models](#data-models)
4. [Template System](#template-system)
5. [Configuration System](#configuration-system)
6. [Error Handling](#error-handling)
7. [Security](#security)
8. [Performance](#performance)

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Claude Desktop                          │
│                    (MCP Client)                              │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ MCP Protocol (stdio)
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                   nix-devshell-mcp                           │
│                    (MCP Server)                              │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              MCP Server Layer                          │ │
│  │  - Tool registration (create_devshell, list_profiles) │ │
│  │  - Request/Response handling                          │ │
│  │  - Error serialization                                │ │
│  └──────────────┬─────────────────────┬───────────────────┘ │
│                 │                     │                      │
│  ┌──────────────▼──────────┐ ┌───────▼──────────────────┐  │
│  │    Tool Handlers        │ │   Profile Manager        │  │
│  │  - create_devshell()    │ │  - loadProfile()         │  │
│  │  - list_profiles()      │ │  - validateProfile()     │  │
│  └──────────────┬──────────┘ └───────┬──────────────────┘  │
│                 │                     │                      │
│  ┌──────────────▼─────────────────────▼──────────────────┐  │
│  │              Core Services                             │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │  │
│  │  │   Config     │ │   Renderer   │ │  Filesystem  │  │  │
│  │  │   Manager    │ │   Engine     │ │   Manager    │  │  │
│  │  └──────────────┘ └──────────────┘ └──────────────┘  │  │
│  │  ┌──────────────┐ ┌──────────────┐                   │  │
│  │  │  Validator   │ │   Executor   │                   │  │
│  │  └──────────────┘ └──────────────┘                   │  │
│  └────────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ File I/O
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    Filesystem                                │
│                                                              │
│  User Config:  ~/.config/nix-devshell-mcp/config.json       │
│  Templates:    ./profiles/{profile-name}/                   │
│  Target:       {projectPath}/                               │
└──────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

#### Flow 1: Project Creation

```
User → Claude → create_devshell()
                      │
                      ├─→ Load Profile (ProfileManager)
                      │   └─→ Read profile.json + templates
                      │
                      ├─→ Load Config (ConfigManager)
                      │   ├─→ User config (~/.config/)
                      │   ├─→ Project config (./devshell-config.json)
                      │   └─→ Merge with priority
                      │
                      ├─→ Validate Inputs (Validator)
                      │   ├─→ Schema validation (AJV)
                      │   └─→ Path safety checks
                      │
                      ├─→ Render Templates (Renderer)
                      │   ├─→ Compile Handlebars templates
                      │   ├─→ Apply context (config + options)
                      │   └─→ Generate file contents
                      │
                      ├─→ Write Files (FilesystemManager)
                      │   ├─→ Check existing files
                      │   ├─→ Create directories
                      │   ├─→ Write new files only
                      │   └─→ Set permissions
                      │
                      └─→ Execute Hooks (Executor)
                          └─→ Run post-create.sh
                              └─→ git init (if not exists)
```

#### Flow 2: Profile Listing

```
User → Claude → list_profiles()
                      │
                      └─→ Scan profiles/ directory
                          ├─→ Read each profile.json
                          ├─→ Validate metadata
                          └─→ Return profile list
```

---

## Component Breakdown

### 1. MCP Server Layer (`src/index.ts`)

**Responsibility**: MCP protocol implementation and tool registration

**Key Functions**:
```typescript
async function main() {
  const server = new Server({
    name: "nix-devshell-mcp",
    version: "1.0.0"
  }, {
    capabilities: {
      tools: {}
    }
  });

  // Register tools
  server.setRequestHandler(ListToolsRequestSchema, handleListTools);
  server.setRequestHandler(CallToolRequestSchema, handleCallTool);

  // Start server
  await server.connect(new StdioServerTransport());
}
```

**Dependencies**:
- @modelcontextprotocol/sdk
- Tool handlers (createDevshell, listProfiles)

**Error Handling**:
- Catch all unhandled errors
- Log to stderr
- Return formatted MCP errors

---

### 2. Tool Handlers (`src/tools/`)

#### createDevshell (`src/tools/createDevshell.ts`)

**Responsibility**: Handle create_devshell tool invocations

**Interface**:
```typescript
interface CreateDevshellInput {
  projectPath: string;
  profile: string;
  options?: Record<string, unknown>;
}

interface CreateDevshellResult {
  success: boolean;
  message: string;
  filesCreated: string[];
  filesSkipped: string[];
  projectPath: string;
}

async function createDevshell(
  input: CreateDevshellInput
): Promise<CreateDevshellResult>
```

**Process**:
1. Validate input against schema
2. Load profile from profiles/ directory
3. Load and merge configurations
4. Render templates with context
5. Write files (skip existing)
6. Execute post-create hooks
7. Return result summary

**Error Scenarios**:
- Profile not found → `PROFILE_NOT_FOUND`
- Invalid options → `INVALID_OPTIONS`
- Path traversal attempt → `INVALID_PATH`
- Filesystem error → `FILESYSTEM_ERROR`

---

#### listProfiles (`src/tools/listProfiles.ts`)

**Responsibility**: List available profiles

**Interface**:
```typescript
interface ProfileMetadata {
  name: string;
  displayName: string;
  description: string;
  version: string;
  supportedOptions: ProfileOption[];
  tags: string[];
  examples: string[];
}

async function listProfiles(): Promise<ProfileMetadata[]>
```

**Process**:
1. Scan profiles/ directory
2. Read profile.json from each
3. Validate metadata
4. Return sorted list

**Caching**: Profile list cached for 60 seconds

---

### 3. Profile Manager (`src/profiles/ProfileManager.ts`)

**Responsibility**: Load and manage profile templates

**Interface**:
```typescript
class ProfileManager {
  async loadProfile(profileName: string): Promise<Profile>
  async validateProfile(profile: Profile): Promise<void>
  async listProfiles(): Promise<ProfileMetadata[]>
  getProfilePath(profileName: string): string
}
```

**Profile Structure**:
```
profiles/
└── {profile-name}/
    ├── profile.json           # Metadata
    ├── flake.nix.hbs          # Handlebars template
    ├── .envrc                 # Static file
    ├── hooks/
    │   └── post-create.sh     # Executable hook
    └── scaffold/
        ├── src/
        │   └── index.ts.hbs   # Scaffold templates
        ├── package.json.hbs
        └── README.md.hbs
```

**Validation**:
- profile.json exists and valid
- Required templates present
- Handlebars syntax valid
- post-create.sh is executable

---

### 4. Config Manager (`src/config/ConfigManager.ts`)

**Responsibility**: Load, merge, and validate configurations

**Interface**:
```typescript
class ConfigManager {
  async loadUserConfig(): Promise<UserConfig | null>
  async loadProjectConfig(projectPath: string): Promise<ProjectConfig | null>
  mergeConfigs(
    userConfig: UserConfig | null,
    projectConfig: ProjectConfig | null,
    toolOptions: Record<string, unknown>,
    profileDefaults: Record<string, unknown>
  ): MergedConfig
  async validateConfig(config: unknown): Promise<void>
}
```

**Configuration Priority** (highest to lowest):
1. Tool invocation `options` parameter
2. Project config: `./devshell-config.json`
3. User config: `~/.config/nix-devshell-mcp/config.json`
4. Profile defaults from `profile.json`
5. System defaults

**Merge Strategy**:
- Shallow merge for top-level keys
- Deep merge for nested objects
- Arrays are replaced (not merged)
- Null/undefined values ignored

**Example**:
```typescript
// User config
{
  "author": "Jane Doe",
  "defaults": {
    "nodeVersion": "20"
  }
}

// Project config
{
  "defaults": {
    "nodeVersion": "18",
    "includeDatabase": true
  },
  "npmRegistry": "https://registry.example.com"
}

// Merged result (project overrides user)
{
  "author": "Jane Doe",
  "defaults": {
    "nodeVersion": "18",         // Project wins
    "includeDatabase": true
  },
  "npmRegistry": "https://registry.example.com"
}
```

---

### 5. Renderer Engine (`src/renderer/Renderer.ts`)

**Responsibility**: Template rendering with Handlebars

**Interface**:
```typescript
class Renderer {
  async renderTemplate(
    templatePath: string,
    context: RenderContext
  ): Promise<string>

  async renderProfile(
    profile: Profile,
    context: RenderContext
  ): Promise<RenderedFiles>

  registerHelper(name: string, fn: Handlebars.HelperDelegate): void
}
```

**Custom Handlebars Helpers**:

```typescript
// {{json value}}
Handlebars.registerHelper('json', (value) => {
  return JSON.stringify(value, null, 2);
});

// {{#if_eq a b}}
Handlebars.registerHelper('if_eq', (a, b, options) => {
  return a === b ? options.fn(this) : options.inverse(this);
});

// {{#if_includes array value}}
Handlebars.registerHelper('if_includes', (array, value, options) => {
  return array?.includes(value) ? options.fn(this) : options.inverse(this);
});

// {{lowercase str}}
Handlebars.registerHelper('lowercase', (str) => {
  return str?.toLowerCase();
});

// {{uppercase str}}
Handlebars.registerHelper('uppercase', (str) => {
  return str?.toUpperCase();
});

// {{year}}
Handlebars.registerHelper('year', () => {
  return new Date().getFullYear();
});
```

**Render Context**:
```typescript
interface RenderContext {
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
```

---

### 6. Filesystem Manager (`src/fs/FilesystemManager.ts`)

**Responsibility**: Safe file operations

**Interface**:
```typescript
class FilesystemManager {
  async ensureDirectory(dirPath: string): Promise<void>
  async fileExists(filePath: string): Promise<boolean>
  async writeFile(filePath: string, content: string): Promise<void>
  async copyFile(src: string, dest: string): Promise<void>
  async makeExecutable(filePath: string): Promise<void>
  async safeWrite(
    filePath: string,
    content: string,
    options: { skipIfExists: boolean }
  ): Promise<WriteResult>
}

interface WriteResult {
  written: boolean;
  reason?: 'exists' | 'error';
}
```

**Safety Features**:
- Path traversal prevention
- Atomic writes (write to temp, then rename)
- Existing file protection
- Permission validation
- Comprehensive logging

**Path Validation**:
```typescript
function validatePath(projectPath: string, targetPath: string): void {
  const resolved = path.resolve(projectPath, targetPath);
  const normalized = path.normalize(resolved);

  if (!normalized.startsWith(path.normalize(projectPath))) {
    throw new Error('Path traversal detected');
  }
}
```

---

### 7. Validator (`src/validation/Validator.ts`)

**Responsibility**: Input validation with JSON Schema

**Interface**:
```typescript
class Validator {
  validateToolInput(toolName: string, input: unknown): void
  validateConfig(config: unknown): void
  validateProfileOptions(
    profile: string,
    options: unknown
  ): void
}
```

**Validation Strategy**:
- Use AJV for JSON schema validation
- Custom validators for complex rules
- Clear, actionable error messages

**Example Schema** (create_devshell input):
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["projectPath", "profile"],
  "properties": {
    "projectPath": {
      "type": "string",
      "minLength": 1,
      "description": "Absolute or relative path to project directory"
    },
    "profile": {
      "type": "string",
      "enum": ["typescript-node", "angular-frontend", "python-fastapi", "java-spring-boot"],
      "description": "Template profile to use"
    },
    "options": {
      "type": "object",
      "description": "Profile-specific options",
      "additionalProperties": true
    }
  }
}
```

---

### 8. Executor (`src/executor/Executor.ts`)

**Responsibility**: Execute post-creation hooks

**Interface**:
```typescript
class Executor {
  async executeHook(
    hookPath: string,
    workingDir: string,
    env?: Record<string, string>
  ): Promise<ExecutionResult>
}

interface ExecutionResult {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
}
```

**Hook Execution**:
- Execute in project directory
- Capture stdout/stderr
- Timeout after 30 seconds
- Pass environment variables

**Post-Create Hook Template**:
```bash
#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$1"
cd "$PROJECT_DIR"

# Initialize git repository
if [ ! -d ".git" ]; then
  echo "Initializing git repository..."
  git init
  echo "Git repository initialized."
fi

# Note: Dependencies are managed by Nix
# Run 'direnv allow' to activate the development environment
```

---

## Data Models

### Profile Model

```typescript
interface Profile {
  metadata: ProfileMetadata;
  templates: ProfileTemplates;
  defaults: Record<string, unknown>;
}

interface ProfileMetadata {
  name: string;
  displayName: string;
  description: string;
  version: string;
  supportedOptions: ProfileOption[];
  tags: string[];
  examples: string[];
}

interface ProfileOption {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  description: string;
  required: boolean;
  default?: unknown;
  enum?: string[];
}

interface ProfileTemplates {
  flake: string;              // Path to flake.nix.hbs
  scaffold: ScaffoldFile[];   // Scaffold files
  static: StaticFile[];       // Static files (.envrc, etc.)
  hooks: HookFile[];          // Post-create hooks
}

interface ScaffoldFile {
  source: string;      // Path to template
  destination: string; // Relative path in project
  executable: boolean;
}

interface StaticFile {
  source: string;
  destination: string;
}

interface HookFile {
  source: string;
  executable: boolean;
}
```

### Configuration Model

```typescript
interface UserConfig {
  author?: string;
  email?: string;
  organization?: string;
  defaults?: {
    nodeVersion?: string;
    pythonVersion?: string;
    javaVersion?: string;
  };
  registries?: {
    npm?: string;
    pypi?: string;
    maven?: string;
  };
  profileDefaults?: {
    [profileName: string]: Record<string, unknown>;
  };
}

interface ProjectConfig {
  profile?: string;
  options?: Record<string, unknown>;
  defaults?: Record<string, unknown>;
  registries?: {
    npm?: string;
    pypi?: string;
    maven?: string;
  };
}

interface MergedConfig {
  author: string;
  email: string;
  organization?: string;
  nodeVersion?: string;
  pythonVersion?: string;
  javaVersion?: string;
  npmRegistry?: string;
  pypiIndex?: string;
  mavenRepository?: string;
  [key: string]: unknown;
}
```

### Tool Models

```typescript
interface CreateDevshellInput {
  projectPath: string;
  profile: string;
  options?: {
    nodeVersion?: string;
    pythonVersion?: string;
    javaVersion?: string;
    includeDatabase?: boolean;
    databaseType?: 'postgresql' | 'mysql';
    [key: string]: unknown;
  };
}

interface CreateDevshellOutput {
  success: boolean;
  message: string;
  filesCreated: string[];
  filesSkipped: string[];
  projectPath: string;
  nextSteps: string[];
}

interface ListProfilesOutput {
  profiles: ProfileMetadata[];
}
```

---

## Template System

### Template Structure Conventions

All profiles follow a consistent structure:

```
profiles/{profile-name}/
├── profile.json              # Metadata and configuration
├── flake.nix.hbs            # Nix flake template
├── .envrc                   # Static direnv file
├── hooks/
│   └── post-create.sh       # Post-creation script (chmod +x)
└── scaffold/
    ├── src/                 # Source code templates
    ├── tests/               # Test templates
    ├── package.json.hbs     # Config templates
    ├── README.md.hbs        # Documentation template
    └── .gitignore           # Static gitignore
```

### Template Naming Conventions

- **Handlebars templates**: `*.hbs` extension
- **Static files**: No extension modification
- **Executable hooks**: `*.sh` with execute permission
- **Nested templates**: Mirror final project structure

### Handlebars Template Best Practices

1. **Use descriptive variable names**:
```handlebars
{{project.name}} not {{name}}
{{config.nodeVersion}} not {{version}}
```

2. **Provide fallbacks**:
```handlebars
{{#if config.nodeVersion}}
  NODE_VERSION="{{config.nodeVersion}}"
{{else}}
  NODE_VERSION="20"
{{/if}}
```

3. **Use helpers for complex logic**:
```handlebars
{{#if_eq options.framework "express"}}
  # Express-specific configuration
{{/if_eq}}
```

4. **Comment complex sections**:
```handlebars
{{!-- Database configuration section --}}
{{#if options.includeDatabase}}
  ...
{{/if}}
```

5. **Escape when necessary**:
```handlebars
{{{rawContent}}}  <!-- Triple braces for unescaped -->
```

### Profile Metadata Schema

```json
{
  "name": "typescript-node",
  "displayName": "TypeScript Node.js Backend",
  "description": "Node.js backend with TypeScript, Express, and Vitest",
  "version": "1.0.0",
  "supportedOptions": [
    {
      "name": "nodeVersion",
      "type": "string",
      "description": "Node.js version (18, 20, 22)",
      "required": false,
      "default": "20",
      "enum": ["18", "20", "22"]
    },
    {
      "name": "includeDatabase",
      "type": "boolean",
      "description": "Include PostgreSQL in devshell",
      "required": false,
      "default": false
    }
  ],
  "tags": ["backend", "typescript", "nodejs", "express"],
  "examples": [
    "Create a Node.js API with TypeScript",
    "Build a backend service with Express",
    "Set up a TypeScript backend with PostgreSQL"
  ],
  "defaults": {
    "nodeVersion": "20",
    "includeDatabase": false
  }
}
```

---

## Configuration System

### Configuration File Locations

1. **User Config**: `~/.config/nix-devshell-mcp/config.json`
   - Personal defaults
   - Persists across projects
   - Optional

2. **Project Config**: `{projectPath}/devshell-config.json`
   - Project-specific settings
   - Committable to version control
   - Optional

### Configuration Priority & Merging

Priority (highest to lowest):
1. Tool invocation options
2. Project config
3. User config
4. Profile defaults
5. System defaults

Merge algorithm:
```typescript
function mergeConfigs(
  system: Config,
  profile: Config,
  user: Config | null,
  project: Config | null,
  tool: Config
): MergedConfig {
  return deepMerge(system, profile, user, project, tool);
}

function deepMerge(...configs: Config[]): MergedConfig {
  return configs.reduce((acc, config) => {
    if (!config) return acc;

    for (const [key, value] of Object.entries(config)) {
      if (value === null || value === undefined) {
        continue; // Skip null/undefined
      }

      if (Array.isArray(value)) {
        acc[key] = value; // Arrays replace, don't merge
      } else if (typeof value === 'object') {
        acc[key] = deepMerge(acc[key] || {}, value);
      } else {
        acc[key] = value;
      }
    }

    return acc;
  }, {});
}
```

### Environment Variable Support

Configurations can reference environment variables:

```json
{
  "registries": {
    "npm": "${NPM_REGISTRY_URL}",
    "npmToken": "${NPM_TOKEN}"
  }
}
```

Resolution:
```typescript
function resolveEnvVars(config: any): any {
  const envVarPattern = /\$\{([^}]+)\}/g;

  return JSON.parse(
    JSON.stringify(config),
    (key, value) => {
      if (typeof value === 'string') {
        return value.replace(envVarPattern, (match, varName) => {
          return process.env[varName] || match;
        });
      }
      return value;
    }
  );
}
```

---

## Error Handling

### Error Types

```typescript
enum ErrorCode {
  // Validation errors (4xx equivalent)
  INVALID_INPUT = 'INVALID_INPUT',
  PROFILE_NOT_FOUND = 'PROFILE_NOT_FOUND',
  INVALID_OPTIONS = 'INVALID_OPTIONS',
  INVALID_PATH = 'INVALID_PATH',
  INVALID_CONFIG = 'INVALID_CONFIG',

  // Filesystem errors (5xx equivalent)
  FILESYSTEM_ERROR = 'FILESYSTEM_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  DIRECTORY_NOT_FOUND = 'DIRECTORY_NOT_FOUND',

  // Template errors
  TEMPLATE_ERROR = 'TEMPLATE_ERROR',
  RENDER_ERROR = 'RENDER_ERROR',

  // Execution errors
  HOOK_EXECUTION_FAILED = 'HOOK_EXECUTION_FAILED',
  HOOK_TIMEOUT = 'HOOK_TIMEOUT',

  // System errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

class McpError extends Error {
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

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}
```

### Error Handling Strategy

1. **Catch at boundaries**: All errors caught at tool handler level
2. **Transform**: Convert to McpError with code
3. **Log**: Log full error with stack trace
4. **Return**: Return user-friendly message via MCP

Example:
```typescript
async function createDevshell(input: CreateDevshellInput) {
  try {
    // ... implementation
  } catch (error) {
    if (error instanceof McpError) {
      logger.error(`MCP Error: ${error.code}`, error);
      throw error;
    }

    if (error.code === 'ENOENT') {
      throw new McpError(
        ErrorCode.DIRECTORY_NOT_FOUND,
        `Directory not found: ${input.projectPath}`,
        { path: input.projectPath }
      );
    }

    if (error.code === 'EACCES') {
      throw new McpError(
        ErrorCode.PERMISSION_DENIED,
        `Permission denied: ${error.path}`,
        { path: error.path }
      );
    }

    // Unknown error
    logger.error('Unknown error', error);
    throw new McpError(
      ErrorCode.INTERNAL_ERROR,
      'An unexpected error occurred',
      { originalError: error.message }
    );
  }
}
```

---

## Security

### Path Traversal Prevention

```typescript
function validateProjectPath(projectPath: string): void {
  const normalized = path.normalize(projectPath);
  const resolved = path.resolve(projectPath);

  // Prevent path traversal
  if (normalized.includes('..')) {
    throw new McpError(
      ErrorCode.INVALID_PATH,
      'Path traversal detected in project path'
    );
  }

  // Prevent absolute paths outside workspace (optional)
  if (path.isAbsolute(normalized)) {
    // Allow, but log
    logger.warn(`Absolute path used: ${normalized}`);
  }
}

function validateFileWrite(projectPath: string, filePath: string): void {
  const projectNorm = path.normalize(path.resolve(projectPath));
  const fileNorm = path.normalize(path.resolve(projectPath, filePath));

  if (!fileNorm.startsWith(projectNorm)) {
    throw new McpError(
      ErrorCode.INVALID_PATH,
      `File path escapes project directory: ${filePath}`
    );
  }
}
```

### Input Sanitization

- All inputs validated against JSON schemas
- String inputs trimmed and length-limited
- Path components validated
- No shell command injection (no `eval`, `exec` with user input)

### Credential Handling

- Never log sensitive values (tokens, passwords)
- Support environment variable references
- No credentials in generated files
- Clear documentation about .gitignore for secrets

### File Permissions

- Hooks: `0755` (rwxr-xr-x)
- Scripts: `0755` (rwxr-xr-x)
- Regular files: `0644` (rw-r--r--)
- Configs: `0600` (rw-------) if contain credentials

---

## Performance

### Optimization Strategies

1. **Profile Caching**: Cache loaded profiles for 60 seconds
2. **Template Compilation**: Compile Handlebars templates once
3. **Config Caching**: Cache user config for session
4. **Lazy Loading**: Load profiles only when needed
5. **Parallel I/O**: Read multiple files concurrently

### Performance Targets

- **Server Startup**: < 2 seconds
- **Project Generation**: < 10 seconds
- **Profile Listing**: < 1 second
- **Memory Usage**: < 100MB
- **CPU Usage**: < 50% of one core during generation

### Profiling Points

```typescript
class PerformanceMonitor {
  mark(label: string): void
  measure(startLabel: string, endLabel: string): number
  report(): PerformanceReport
}

// Usage
perf.mark('render-start');
await renderer.renderProfile(profile, context);
perf.mark('render-end');
const renderTime = perf.measure('render-start', 'render-end');
logger.debug(`Template rendering took ${renderTime}ms`);
```

---

## Testing Strategy

### Unit Tests

Test individual components in isolation:

- ConfigManager: Config loading and merging
- Renderer: Template rendering with various contexts
- Validator: Schema validation
- FilesystemManager: File operations (with mocks)
- ProfileManager: Profile loading and validation

### Integration Tests

Test component interactions:

- Full create_devshell flow with real filesystem
- Template rendering + file writing
- Config merging across all levels
- Hook execution

### Test Fixtures

```
tests/
├── fixtures/
│   ├── profiles/
│   │   └── test-profile/
│   │       ├── profile.json
│   │       └── flake.nix.hbs
│   ├── configs/
│   │   ├── user-config.json
│   │   └── project-config.json
│   └── expected/
│       └── typescript-node/
│           ├── flake.nix
│           └── package.json
├── unit/
│   ├── config.test.ts
│   ├── renderer.test.ts
│   └── validator.test.ts
└── integration/
    ├── create-devshell.test.ts
    └── list-profiles.test.ts
```

### Coverage Requirements

- Line coverage: ≥ 80%
- Branch coverage: ≥ 75%
- Function coverage: ≥ 85%
- Critical paths: 100%

---

## Logging

### Log Levels

- **ERROR**: Unrecoverable errors
- **WARN**: Recoverable issues, deprecated usage
- **INFO**: Major operations (project created, profile loaded)
- **DEBUG**: Detailed flow information
- **TRACE**: Very detailed (disabled in production)

### Log Format

```typescript
interface LogEntry {
  timestamp: string;      // ISO 8601
  level: LogLevel;
  component: string;      // Component name
  message: string;
  context?: unknown;      // Additional context
  error?: {
    message: string;
    stack?: string;
  };
}
```

### Sensitive Data Filtering

```typescript
function sanitizeLog(data: any): any {
  const sensitiveKeys = ['token', 'password', 'secret', 'key'];

  return JSON.parse(JSON.stringify(data), (key, value) => {
    if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
      return '[REDACTED]';
    }
    return value;
  });
}
```

---

## Deployment

### Distribution

```json
{
  "name": "nix-devshell-mcp",
  "version": "1.0.0",
  "main": "build/index.js",
  "bin": {
    "nix-devshell-mcp": "build/index.js"
  },
  "files": [
    "build/",
    "profiles/"
  ]
}
```

### Installation

```bash
# Global installation
npm install -g nix-devshell-mcp

# Local development
npm install
npm run build
```

### MCP Client Configuration

Claude Desktop config (`~/.config/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "nix-devshell": {
      "command": "nix-devshell-mcp"
    }
  }
}
```

Or with explicit path:
```json
{
  "mcpServers": {
    "nix-devshell": {
      "command": "node",
      "args": ["/path/to/nix-devshell-mcp/build/index.js"]
    }
  }
}
```

---

## Future Technical Considerations

### Extensibility Points

1. **Custom Helpers**: Register additional Handlebars helpers
2. **Hook System**: Support more hook types (pre-create, pre-render, etc.)
3. **Profile Inheritance**: Profiles extend base profiles
4. **Plugin System**: Third-party plugins for custom logic

### Scalability Considerations

1. **Profile Repository**: External profile repositories via URLs
2. **Caching Layer**: Persistent cache for remote profiles
3. **Async Rendering**: Stream large template renders
4. **Incremental Updates**: Update existing projects with new profile versions

---

**Document Owner**: Technical Lead
**Review Cycle**: Before each phase implementation
**Next Review**: After Phase 1 completion