# Quick Reference

**Project**: nix-devshell-mcp
**Version**: 1.0.0
**Last Updated**: 2025-11-12

---

## Quick Links

- [Common Commands](#common-commands)
- [Profile Options](#profile-options)
- [Handlebars Helpers](#handlebars-helpers)
- [Error Codes](#error-codes)
- [File Permissions](#file-permissions)
- [Configuration Locations](#configuration-locations)
- [Dependencies](#dependencies)

---

## Common Commands

### Development

```bash
# Install dependencies
npm install

# Build project
npm run build

# Development mode (watch)
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Test coverage
npm run test:coverage

# Lint code
npm run lint

# Fix lint issues
npm run lint:fix

# Format code
npm run format
```

### Testing MCP Server

```bash
# Start server manually
node build/index.js

# Test list_profiles
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node build/index.js

# Test create_devshell
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"create_devshell","arguments":{"projectPath":"./test","profile":"typescript-node"}}}' | node build/index.js
```

### Installing Globally

```bash
# Build first
npm run build

# Install globally
npm install -g .

# Use globally
nix-devshell-mcp
```

### Claude Desktop Configuration

```bash
# Open config file
code ~/.config/Claude/claude_desktop_config.json

# Add server
{
  "mcpServers": {
    "nix-devshell": {
      "command": "node",
      "args": ["/path/to/nix-devshell-mcp/build/index.js"]
    }
  }
}

# Or if installed globally
{
  "mcpServers": {
    "nix-devshell": {
      "command": "nix-devshell-mcp"
    }
  }
}
```

---

## Profile Options

### typescript-node

```json
{
  "nodeVersion": "18" | "20" | "22",         // default: "20"
  "packageManager": "npm" | "yarn" | "pnpm", // default: "npm"
  "includeDatabase": boolean,                 // default: false
  "databaseType": "postgresql" | "mysql",     // default: "postgresql"
  "includeRedis": boolean,                    // default: false
  "framework": "express" | "fastify"          // default: "express"
}
```

### angular-frontend

```json
{
  "nodeVersion": "18" | "20" | "22",         // default: "20"
  "angularVersion": "17" | "18",             // default: "17"
  "packageManager": "npm" | "yarn" | "pnpm", // default: "npm"
  "styling": "css" | "scss" | "sass",        // default: "scss"
  "includeRouter": boolean,                   // default: true
  "ssr": boolean                              // default: false
}
```

### python-fastapi

```json
{
  "pythonVersion": "3.10" | "3.11" | "3.12",         // default: "3.11"
  "dependencyManager": "poetry" | "pip-tools",       // default: "poetry"
  "includeDatabase": boolean,                         // default: false
  "databaseType": "postgresql" | "mysql",             // default: "postgresql"
  "includeRedis": boolean,                            // default: false
  "includeAlembic": boolean,                          // default: true
  "orm": "sqlalchemy" | "tortoise"                    // default: "sqlalchemy"
}
```

### java-spring-boot

```json
{
  "javaVersion": "17" | "21",                       // default: "21"
  "springBootVersion": "3.1.0" | "3.2.0",           // default: "3.2.0"
  "buildTool": "maven" | "gradle",                  // default: "maven"
  "includeDatabase": boolean,                        // default: false
  "databaseType": "postgresql" | "mysql" | "h2",     // default: "postgresql"
  "includeRedis": boolean,                           // default: false
  "includeSecurity": boolean,                        // default: false
  "packaging": "jar" | "war"                         // default: "jar"
}
```

---

## Handlebars Helpers

### json

Serialize value to JSON:

```handlebars
{{{json config}}}
```

Output:
```json
{
  "key": "value"
}
```

### if_eq

Compare two values:

```handlebars
{{#if_eq options.framework "express"}}
  Express code
{{else}}
  Fastify code
{{/if_eq}}
```

### if_includes

Check if array includes value:

```handlebars
{{#if_includes options.features "auth"}}
  Authentication enabled
{{/if_includes}}
```

### lowercase

Convert to lowercase:

```handlebars
{{lowercase project.name}}
```

### uppercase

Convert to uppercase:

```handlebars
{{uppercase project.name}}
```

### year

Get current year:

```handlebars
Copyright {{year}}
```

---

## Error Codes

| Code | Description | Action |
|------|-------------|--------|
| `INVALID_INPUT` | Input validation failed | Check parameters against schema |
| `PROFILE_NOT_FOUND` | Profile doesn't exist | Use `list_profiles` to see available |
| `INVALID_OPTIONS` | Profile options invalid | Check profile's supported options |
| `INVALID_PATH` | Path validation failed | Use valid path, avoid `..` |
| `INVALID_CONFIG` | Config file invalid | Validate against schema |
| `FILESYSTEM_ERROR` | File operation failed | Check permissions and disk space |
| `PERMISSION_DENIED` | Insufficient permissions | Check file/directory permissions |
| `DIRECTORY_NOT_FOUND` | Directory doesn't exist | Create directory first |
| `TEMPLATE_ERROR` | Template malformed | Report bug with profile name |
| `RENDER_ERROR` | Template rendering failed | Check template syntax |
| `HOOK_EXECUTION_FAILED` | Post-create hook failed | Check hook script |
| `HOOK_TIMEOUT` | Hook exceeded timeout | Simplify hook script |
| `INTERNAL_ERROR` | Unexpected error | Report bug with details |

---

## File Permissions

### Unix Permission Modes

```
0755 (rwxr-xr-x) - Executable scripts
0644 (rw-r--r--) - Regular files
0600 (rw-------) - Config files with secrets
```

### Setting Permissions

```typescript
// In code
await fs.chmod(filePath, 0o755);

// From command line
chmod +x hooks/post-create.sh
chmod 755 hooks/post-create.sh
```

### Required Permissions

| File Type | Permission | Reason |
|-----------|------------|--------|
| `post-create.sh` | 0755 | Must be executable |
| `flake.nix` | 0644 | Regular file |
| `package.json` | 0644 | Regular file |
| `.envrc` | 0644 | Regular file |

---

## Configuration Locations

### User Config

```
Linux/macOS: ~/.config/nix-devshell-mcp/config.json
Windows:     %APPDATA%\nix-devshell-mcp\config.json
```

### Project Config

```
{projectPath}/devshell-config.json
```

### Priority Order

1. Tool invocation options (highest)
2. Project config
3. User config
4. Profile defaults
5. System defaults (lowest)

---

## Configuration Priority

When generating a project, configurations are merged in this order (later overrides earlier):

1. **System defaults** (hardcoded in application)
2. **Profile defaults** (from `profile.json`)
3. **User config** (`~/.config/nix-devshell-mcp/config.json`)
4. **Project config** (`./devshell-config.json` in target directory)
5. **Tool options** (passed to `create_devshell` tool)

---

## Configuration Examples

### Minimal User Config

```json
{
  "author": "Your Name"
}
```

### Typical User Config

```json
{
  "author": "Jane Developer",
  "email": "jane@example.com",
  "defaults": {
    "nodeVersion": "20",
    "pythonVersion": "3.11"
  }
}
```

### Enterprise User Config

```json
{
  "author": "John Smith",
  "email": "john@company.com",
  "registries": {
    "npm": "https://npm.internal.company.com",
    "pypi": "https://pypi.internal.company.com/simple",
    "maven": "https://maven.internal.company.com"
  }
}
```

### Project Config

```json
{
  "defaults": {
    "nodeVersion": "20"
  },
  "registries": {
    "npm": "https://npm.internal.company.com"
  }
}
```

---

## Dependencies

### Production Dependencies

```json
{
  "@modelcontextprotocol/sdk": "^1.0.0",
  "handlebars": "^4.7.8",
  "ajv": "^8.12.0"
}
```

### Development Dependencies

```json
{
  "typescript": "^5.0.0",
  "vitest": "^1.0.0",
  "@types/node": "^20.0.0",
  "@types/handlebars": "^4.1.0",
  "eslint": "^8.56.0",
  "@typescript-eslint/eslint-plugin": "^6.15.0",
  "@typescript-eslint/parser": "^6.15.0",
  "prettier": "^3.1.1"
}
```

---

## Validation Patterns

### Email Validation

```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
```

### URL Validation

```typescript
import { URL } from 'url';

function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}
```

### Path Validation

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

## Common Patterns

### Loading a Profile

```typescript
import { ProfileManager } from './profiles/ProfileManager';

const manager = new ProfileManager();
const profile = await manager.loadProfile('typescript-node');
```

### Rendering a Template

```typescript
import { Renderer } from './renderer/Renderer';

const renderer = new Renderer();
const result = await renderer.renderTemplate('/path/to/template.hbs', {
  project: { name: 'my-project' },
  options: { nodeVersion: '20' }
});
```

### Writing Files Safely

```typescript
import { FilesystemManager } from './fs/FilesystemManager';

const fsManager = new FilesystemManager();
const result = await fsManager.safeWrite(
  '/path/to/file',
  'content',
  { skipIfExists: true }
);

if (!result.written) {
  console.log('File already exists, skipped');
}
```

### Merging Configs

```typescript
import { ConfigManager } from './config/ConfigManager';

const configManager = new ConfigManager();
const userConfig = await configManager.loadUserConfig();
const projectConfig = await configManager.loadProjectConfig('./project');
const merged = configManager.mergeConfigs(
  userConfig,
  projectConfig,
  toolOptions,
  profileDefaults
);
```

---

## Debugging Tips

### Enable Debug Logging

```typescript
import { logger, LogLevel } from './utils/logger';

logger.setLevel(LogLevel.DEBUG);
```

### Test Template Rendering

```bash
# Create test template
echo "Hello {{name}}!" > test.hbs

# Test render
node -e "
import('./build/renderer/Renderer.js').then(m => {
  const renderer = new m.Renderer();
  renderer.renderTemplate('test.hbs', { name: 'World' })
    .then(console.log);
});
"
```

### Inspect MCP Messages

```bash
# Log all MCP I/O
node build/index.js 2>&1 | tee mcp-debug.log
```

### Check Profile Loading

```bash
node -e "
import('./build/profiles/ProfileManager.js').then(m => {
  const pm = new m.ProfileManager();
  pm.listProfiles().then(profiles => {
    console.log(JSON.stringify(profiles, null, 2));
  });
});
"
```

---

## Testing Shortcuts

### Run Specific Test

```bash
npm test tests/unit/config/ConfigManager.test.ts
```

### Run Tests Matching Pattern

```bash
npm test -- --grep "ConfigManager"
```

### Run Only Changed Tests

```bash
npm test -- --changed
```

### Update Snapshots

```bash
npm test -- --update
```

---

## Git Hooks

### Pre-commit

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash
npm run lint
npm run build
npm test
```

```bash
chmod +x .git/hooks/pre-commit
```

---

## Performance Tips

### Template Caching

Templates are automatically cached after first compile.

### Config Caching

User config is cached for the session.

### Profile Caching

Profiles are cached for 60 seconds.

### Parallel File Operations

Use `Promise.all()` for independent file operations:

```typescript
await Promise.all([
  fsManager.writeFile('file1.txt', 'content1'),
  fsManager.writeFile('file2.txt', 'content2'),
]);
```

---

## Troubleshooting

### MCP Server Not Responding

1. Check if process is running
2. Verify stdio transport
3. Check logs in stderr
4. Test with echo command

### Templates Not Rendering

1. Validate Handlebars syntax
2. Check helper registration
3. Verify context data
4. Test template in isolation

### Config Not Loading

1. Verify file location
2. Check JSON syntax
3. Validate against schema
4. Check file permissions

### Tests Failing

1. Clear build directory: `rm -rf build`
2. Reinstall deps: `rm -rf node_modules && npm install`
3. Clear vitest cache: `rm -rf node_modules/.vitest`
4. Check temp directory permissions

---

## Useful Scripts

### Validate All Profiles

```bash
node -e "
import('./build/profiles/ProfileManager.js').then(async m => {
  const pm = new m.ProfileManager();
  const profiles = await pm.listProfiles();
  for (const p of profiles) {
    console.log('Validating', p.name);
    const full = await pm.loadProfile(p.name);
    await pm.validateProfile(full);
    console.log('✓', p.name);
  }
});
"
```

### Generate Test Project

```bash
node -e "
import('./build/tools/createDevshell.js').then(m => {
  m.createDevshell({
    projectPath: './test-project',
    profile: 'typescript-node',
    options: { nodeVersion: '20' }
  }).then(result => {
    console.log('Success:', result.message);
    console.log('Files:', result.filesCreated.length);
  });
});
"
```

### Clean Build

```bash
#!/bin/bash
rm -rf build node_modules coverage
npm install
npm run build
npm test
```

---

## External Resources

### MCP Documentation
- [MCP Protocol Spec](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/anthropics/mcp-typescript-sdk)

### Nix Documentation
- [Nix Flakes](https://nixos.wiki/wiki/Flakes)
- [direnv](https://direnv.net/)

### Handlebars
- [Handlebars Guide](https://handlebarsjs.com/guide/)
- [Built-in Helpers](https://handlebarsjs.com/guide/builtin-helpers.html)

### Testing
- [Vitest Documentation](https://vitest.dev/)
- [Vitest API](https://vitest.dev/api/)

---

## Keyboard Shortcuts (Development)

| Action | Command |
|--------|---------|
| Run tests | `npm test` |
| Build | `npm run build` |
| Lint | `npm run lint` |
| Format | `npm run format` |
| Dev mode | `npm run dev` |

---

## Environment Variables

### Development

```bash
export NODE_ENV=development
export DEBUG=nix-devshell-mcp:*
export LOG_LEVEL=debug
```

### Testing

```bash
export NODE_ENV=test
export CI=true
```

### Registry Configuration

```bash
export NPM_REGISTRY_URL=https://registry.npmjs.org
export PYPI_INDEX_URL=https://pypi.org/simple
export MAVEN_REPOSITORY_URL=https://repo.maven.apache.org/maven2
```

---

**Quick Reference Version**: 1.0.0
**Last Updated**: 2025-11-12