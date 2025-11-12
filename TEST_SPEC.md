# Test Specification

**Project**: nix-devshell-mcp
**Version**: 1.0.0
**Test Framework**: Vitest
**Last Updated**: 2025-11-12

---

## Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Test Organization](#test-organization)
3. [Unit Tests](#unit-tests)
4. [Integration Tests](#integration-tests)
5. [Test Fixtures](#test-fixtures)
6. [Coverage Requirements](#coverage-requirements)
7. [Running Tests](#running-tests)

---

## Testing Strategy

### Testing Pyramid

```
        /\
       /E2\      End-to-End (Manual)
      /----\
     / Intg \    Integration Tests (~20 tests)
    /--------\
   /   Unit   \  Unit Tests (~50 tests)
  /____________\
```

### Test Philosophy

1. **Unit Tests**: Test individual components in isolation
2. **Integration Tests**: Test component interactions with real filesystem
3. **Manual Testing**: Profile generation with real Nix environments
4. **Test-First Approach**: Write tests before implementation (TDD lite)
5. **Initially Commented**: Tests written but commented out, uncomment as features are built

### Coverage Targets

- **Overall Line Coverage**: ≥ 80%
- **Branch Coverage**: ≥ 75%
- **Function Coverage**: ≥ 85%
- **Critical Paths**: 100% (file operations, validation, template rendering)

### Test Execution Strategy

Phase 1-3: Uncomment and fix tests as features are implemented
Phase 4-6: Add integration tests for complete flows
Phase 7-9: Add edge case and error scenario tests

---

## Test Organization

### Directory Structure

```
tests/
├── unit/
│   ├── config/
│   │   ├── ConfigManager.test.ts
│   │   └── configMerge.test.ts
│   ├── renderer/
│   │   ├── Renderer.test.ts
│   │   └── handlebarsHelpers.test.ts
│   ├── fs/
│   │   ├── FilesystemManager.test.ts
│   │   └── pathValidation.test.ts
│   ├── validation/
│   │   ├── Validator.test.ts
│   │   └── schemaValidation.test.ts
│   ├── profiles/
│   │   ├── ProfileManager.test.ts
│   │   └── profileLoading.test.ts
│   └── executor/
│       └── Executor.test.ts
├── integration/
│   ├── createDevshell.test.ts
│   ├── listProfiles.test.ts
│   ├── endToEnd.test.ts
│   └── configOverrides.test.ts
├── fixtures/
│   ├── profiles/
│   │   └── test-profile/
│   │       ├── profile.json
│   │       ├── flake.nix.hbs
│   │       └── scaffold/
│   │           └── test.txt.hbs
│   ├── configs/
│   │   ├── user-config.json
│   │   ├── project-config.json
│   │   └── invalid-config.json
│   └── expected/
│       └── typescript-node/
│           ├── flake.nix
│           ├── package.json
│           └── tsconfig.json
└── utils/
    ├── testHelpers.ts
    ├── mockFs.ts
    └── fixtures.ts
```

---

## Unit Tests

### ConfigManager Tests

**File**: `tests/unit/config/ConfigManager.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConfigManager } from '../../../src/config/ConfigManager';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  let tempDir: string;

  beforeEach(async () => {
    configManager = new ConfigManager();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-config-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('loadUserConfig', () => {
    it('should load valid user config', async () => {
      const configPath = path.join(tempDir, 'config.json');
      const config = {
        author: 'Test Author',
        email: 'test@example.com',
      };
      await fs.writeFile(configPath, JSON.stringify(config));

      vi.spyOn(configManager as any, 'getUserConfigPath').mockReturnValue(configPath);

      const result = await configManager.loadUserConfig();
      expect(result).toEqual(config);
    });

    it('should return null if config file does not exist', async () => {
      vi.spyOn(configManager as any, 'getUserConfigPath').mockReturnValue(
        path.join(tempDir, 'nonexistent.json')
      );

      const result = await configManager.loadUserConfig();
      expect(result).toBeNull();
    });

    it('should throw error for invalid JSON', async () => {
      const configPath = path.join(tempDir, 'invalid.json');
      await fs.writeFile(configPath, '{ invalid json }');

      vi.spyOn(configManager as any, 'getUserConfigPath').mockReturnValue(configPath);

      await expect(configManager.loadUserConfig()).rejects.toThrow();
    });
  });

  describe('loadProjectConfig', () => {
    it('should load project config from target directory', async () => {
      const config = {
        defaults: {
          nodeVersion: '20',
        },
      };
      const configPath = path.join(tempDir, 'devshell-config.json');
      await fs.writeFile(configPath, JSON.stringify(config));

      const result = await configManager.loadProjectConfig(tempDir);
      expect(result).toEqual(config);
    });

    it('should return null if project config does not exist', async () => {
      const result = await configManager.loadProjectConfig(tempDir);
      expect(result).toBeNull();
    });
  });

  describe('mergeConfigs', () => {
    it('should merge configs with correct priority', () => {
      const userConfig = {
        author: 'User Author',
        defaults: { nodeVersion: '18' },
      };

      const projectConfig = {
        defaults: { nodeVersion: '20' },
        npmRegistry: 'https://registry.example.com',
      };

      const toolOptions = {
        nodeVersion: '22',
      };

      const profileDefaults = {
        nodeVersion: '16',
        includeDatabase: false,
      };

      const result = configManager.mergeConfigs(
        userConfig,
        projectConfig,
        toolOptions,
        profileDefaults
      );

      // Tool options should win
      expect(result.nodeVersion).toBe('22');
      // Project config should override user config
      expect(result.npmRegistry).toBe('https://registry.example.com');
      // User config should be included
      expect(result.author).toBe('User Author');
      // Profile defaults should be included if not overridden
      expect(result.includeDatabase).toBe(false);
    });

    it('should handle null configs gracefully', () => {
      const result = configManager.mergeConfigs(null, null, {}, {});
      expect(result).toBeDefined();
    });

    it('should deep merge nested objects', () => {
      const config1 = {
        registries: { npm: 'https://npm1.com' },
      };

      const config2 = {
        registries: { pypi: 'https://pypi1.com' },
      };

      const result = configManager.mergeConfigs(config1, config2, {}, {});
      expect(result.registries.npm).toBe('https://npm1.com');
      expect(result.registries.pypi).toBe('https://pypi1.com');
    });
  });

  describe('validateConfig', () => {
    it('should validate correct config', async () => {
      const config = {
        author: 'Test',
        email: 'test@example.com',
        defaults: {
          nodeVersion: '20',
        },
      };

      await expect(configManager.validateConfig(config)).resolves.not.toThrow();
    });

    it('should reject config with invalid email', async () => {
      const config = {
        email: 'invalid-email',
      };

      await expect(configManager.validateConfig(config)).rejects.toThrow(/email/);
    });

    it('should reject config with invalid structure', async () => {
      const config = {
        defaults: 'should be object',
      };

      await expect(configManager.validateConfig(config)).rejects.toThrow();
    });
  });
});
```

### Renderer Tests

**File**: `tests/unit/renderer/Renderer.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { Renderer } from '../../../src/renderer/Renderer';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('Renderer', () => {
  let renderer: Renderer;
  let tempDir: string;

  beforeEach(async () => {
    renderer = new Renderer();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-renderer-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('renderTemplate', () => {
    it('should render simple template', async () => {
      const templatePath = path.join(tempDir, 'template.hbs');
      await fs.writeFile(templatePath, 'Hello {{name}}!');

      const result = await renderer.renderTemplate(templatePath, { name: 'World' });
      expect(result).toBe('Hello World!');
    });

    it('should render template with conditionals', async () => {
      const templatePath = path.join(tempDir, 'template.hbs');
      await fs.writeFile(
        templatePath,
        '{{#if includeFeature}}Feature enabled{{else}}Feature disabled{{/if}}'
      );

      const result1 = await renderer.renderTemplate(templatePath, { includeFeature: true });
      expect(result1).toBe('Feature enabled');

      const result2 = await renderer.renderTemplate(templatePath, { includeFeature: false });
      expect(result2).toBe('Feature disabled');
    });

    it('should use custom helpers', async () => {
      const templatePath = path.join(tempDir, 'template.hbs');
      await fs.writeFile(templatePath, '{{uppercase name}}');

      const result = await renderer.renderTemplate(templatePath, { name: 'hello' });
      expect(result).toBe('HELLO');
    });

    it('should handle nested context', async () => {
      const templatePath = path.join(tempDir, 'template.hbs');
      await fs.writeFile(templatePath, '{{project.name}} v{{project.version}}');

      const result = await renderer.renderTemplate(templatePath, {
        project: { name: 'test', version: '1.0.0' },
      });
      expect(result).toBe('test v1.0.0');
    });
  });

  describe('custom helpers', () => {
    it('json helper should serialize objects', async () => {
      const templatePath = path.join(tempDir, 'template.hbs');
      await fs.writeFile(templatePath, '{{{json data}}}');

      const result = await renderer.renderTemplate(templatePath, {
        data: { key: 'value' },
      });
      expect(result).toContain('"key"');
      expect(result).toContain('"value"');
    });

    it('if_eq helper should compare values', async () => {
      const templatePath = path.join(tempDir, 'template.hbs');
      await fs.writeFile(
        templatePath,
        '{{#if_eq a b}}equal{{else}}not equal{{/if_eq}}'
      );

      const result1 = await renderer.renderTemplate(templatePath, { a: 'test', b: 'test' });
      expect(result1).toBe('equal');

      const result2 = await renderer.renderTemplate(templatePath, { a: 'test', b: 'other' });
      expect(result2).toBe('not equal');
    });

    it('lowercase helper should convert to lowercase', async () => {
      const templatePath = path.join(tempDir, 'template.hbs');
      await fs.writeFile(templatePath, '{{lowercase text}}');

      const result = await renderer.renderTemplate(templatePath, { text: 'HELLO' });
      expect(result).toBe('hello');
    });

    it('year helper should return current year', async () => {
      const templatePath = path.join(tempDir, 'template.hbs');
      await fs.writeFile(templatePath, 'Copyright {{year}}');

      const result = await renderer.renderTemplate(templatePath, {});
      expect(result).toBe(`Copyright ${new Date().getFullYear()}`);
    });
  });
});
```

### FilesystemManager Tests

**File**: `tests/unit/fs/FilesystemManager.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FilesystemManager } from '../../../src/fs/FilesystemManager';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('FilesystemManager', () => {
  let fsManager: FilesystemManager;
  let tempDir: string;

  beforeEach(async () => {
    fsManager = new FilesystemManager();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-fs-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('ensureDirectory', () => {
    it('should create directory if it does not exist', async () => {
      const dirPath = path.join(tempDir, 'new-dir');
      await fsManager.ensureDirectory(dirPath);

      const stats = await fs.stat(dirPath);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should not fail if directory already exists', async () => {
      const dirPath = path.join(tempDir, 'existing-dir');
      await fs.mkdir(dirPath);

      await expect(fsManager.ensureDirectory(dirPath)).resolves.not.toThrow();
    });

    it('should create nested directories', async () => {
      const dirPath = path.join(tempDir, 'a', 'b', 'c');
      await fsManager.ensureDirectory(dirPath);

      const stats = await fs.stat(dirPath);
      expect(stats.isDirectory()).toBe(true);
    });
  });

  describe('fileExists', () => {
    it('should return true for existing file', async () => {
      const filePath = path.join(tempDir, 'test.txt');
      await fs.writeFile(filePath, 'content');

      const exists = await fsManager.fileExists(filePath);
      expect(exists).toBe(true);
    });

    it('should return false for non-existing file', async () => {
      const filePath = path.join(tempDir, 'nonexistent.txt');

      const exists = await fsManager.fileExists(filePath);
      expect(exists).toBe(false);
    });
  });

  describe('writeFile', () => {
    it('should write file with content', async () => {
      const filePath = path.join(tempDir, 'output.txt');
      const content = 'Hello, World!';

      await fsManager.writeFile(filePath, content);

      const readContent = await fs.readFile(filePath, 'utf-8');
      expect(readContent).toBe(content);
    });

    it('should create parent directories if needed', async () => {
      const filePath = path.join(tempDir, 'nested', 'output.txt');
      const content = 'content';

      await fsManager.writeFile(filePath, content);

      const readContent = await fs.readFile(filePath, 'utf-8');
      expect(readContent).toBe(content);
    });
  });

  describe('safeWrite', () => {
    it('should write file if it does not exist', async () => {
      const filePath = path.join(tempDir, 'new.txt');
      const content = 'content';

      const result = await fsManager.safeWrite(filePath, content, { skipIfExists: true });

      expect(result.written).toBe(true);
      const readContent = await fs.readFile(filePath, 'utf-8');
      expect(readContent).toBe(content);
    });

    it('should skip writing if file exists and skipIfExists is true', async () => {
      const filePath = path.join(tempDir, 'existing.txt');
      await fs.writeFile(filePath, 'original');

      const result = await fsManager.safeWrite(filePath, 'new content', { skipIfExists: true });

      expect(result.written).toBe(false);
      expect(result.reason).toBe('exists');

      const readContent = await fs.readFile(filePath, 'utf-8');
      expect(readContent).toBe('original');
    });

    it('should overwrite if skipIfExists is false', async () => {
      const filePath = path.join(tempDir, 'existing.txt');
      await fs.writeFile(filePath, 'original');

      const result = await fsManager.safeWrite(filePath, 'new content', { skipIfExists: false });

      expect(result.written).toBe(true);

      const readContent = await fs.readFile(filePath, 'utf-8');
      expect(readContent).toBe('new content');
    });
  });

  describe('makeExecutable', () => {
    it('should make file executable', async () => {
      const filePath = path.join(tempDir, 'script.sh');
      await fs.writeFile(filePath, '#!/bin/bash\necho "test"');

      await fsManager.makeExecutable(filePath);

      const stats = await fs.stat(filePath);
      // Check if file has execute permission
      expect(stats.mode & 0o111).not.toBe(0);
    });
  });

  describe('path validation', () => {
    it('should reject path traversal attempts', () => {
      expect(() => {
        fsManager['validatePath'](tempDir, '../etc/passwd');
      }).toThrow(/traversal/);
    });

    it('should accept valid relative paths', () => {
      expect(() => {
        fsManager['validatePath'](tempDir, 'subdir/file.txt');
      }).not.toThrow();
    });

    it('should accept absolute paths within project', () => {
      const validPath = path.join(tempDir, 'file.txt');
      expect(() => {
        fsManager['validatePath'](tempDir, validPath);
      }).not.toThrow();
    });
  });
});
```

### Validator Tests

**File**: `tests/unit/validation/Validator.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { Validator } from '../../../src/validation/Validator';

describe('Validator', () => {
  let validator: Validator;

  beforeEach(() => {
    validator = new Validator();
  });

  describe('validateToolInput', () => {
    describe('create_devshell', () => {
      it('should validate correct input', () => {
        const input = {
          projectPath: './my-project',
          profile: 'typescript-node',
          options: {
            nodeVersion: '20',
          },
        };

        expect(() => validator.validateToolInput('create_devshell', input)).not.toThrow();
      });

      it('should reject missing projectPath', () => {
        const input = {
          profile: 'typescript-node',
        };

        expect(() => validator.validateToolInput('create_devshell', input)).toThrow(/projectPath/);
      });

      it('should reject missing profile', () => {
        const input = {
          projectPath: './my-project',
        };

        expect(() => validator.validateToolInput('create_devshell', input)).toThrow(/profile/);
      });

      it('should reject invalid profile', () => {
        const input = {
          projectPath: './my-project',
          profile: 'invalid-profile',
        };

        expect(() => validator.validateToolInput('create_devshell', input)).toThrow(/profile/);
      });

      it('should accept valid options', () => {
        const input = {
          projectPath: './my-project',
          profile: 'python-fastapi',
          options: {
            pythonVersion: '3.11',
            includeDatabase: true,
          },
        };

        expect(() => validator.validateToolInput('create_devshell', input)).not.toThrow();
      });
    });

    describe('list_profiles', () => {
      it('should validate empty input', () => {
        const input = {};

        expect(() => validator.validateToolInput('list_profiles', input)).not.toThrow();
      });
    });
  });

  describe('validateProfileOptions', () => {
    it('should validate typescript-node options', () => {
      const options = {
        nodeVersion: '20',
        includeDatabase: true,
        framework: 'express',
      };

      expect(() => validator.validateProfileOptions('typescript-node', options)).not.toThrow();
    });

    it('should reject invalid nodeVersion', () => {
      const options = {
        nodeVersion: '16', // Not in enum
      };

      expect(() => validator.validateProfileOptions('typescript-node', options)).toThrow(/nodeVersion/);
    });

    it('should validate python-fastapi options', () => {
      const options = {
        pythonVersion: '3.11',
        includeDatabase: true,
        orm: 'sqlalchemy',
      };

      expect(() => validator.validateProfileOptions('python-fastapi', options)).not.toThrow();
    });

    it('should validate angular-frontend options', () => {
      const options = {
        angularVersion: '17',
        styling: 'scss',
        includeRouter: true,
      };

      expect(() => validator.validateProfileOptions('angular-frontend', options)).not.toThrow();
    });

    it('should validate java-spring-boot options', () => {
      const options = {
        javaVersion: '21',
        springBootVersion: '3.2.0',
        includeDatabase: true,
      };

      expect(() => validator.validateProfileOptions('java-spring-boot', options)).not.toThrow();
    });
  });
});
```

### ProfileManager Tests

**File**: `tests/unit/profiles/ProfileManager.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ProfileManager } from '../../../src/profiles/ProfileManager';

describe('ProfileManager', () => {
  let profileManager: ProfileManager;

  beforeEach(() => {
    profileManager = new ProfileManager();
  });

  describe('listProfiles', () => {
    it('should list all available profiles', async () => {
      const profiles = await profileManager.listProfiles();

      expect(profiles).toHaveLength(4);
      expect(profiles.map(p => p.name)).toContain('typescript-node');
      expect(profiles.map(p => p.name)).toContain('angular-frontend');
      expect(profiles.map(p => p.name)).toContain('python-fastapi');
      expect(profiles.map(p => p.name)).toContain('java-spring-boot');
    });

    it('should include profile metadata', async () => {
      const profiles = await profileManager.listProfiles();
      const tsProfile = profiles.find(p => p.name === 'typescript-node');

      expect(tsProfile).toBeDefined();
      expect(tsProfile!.displayName).toBeTruthy();
      expect(tsProfile!.description).toBeTruthy();
      expect(tsProfile!.version).toBeTruthy();
      expect(tsProfile!.supportedOptions).toBeInstanceOf(Array);
    });
  });

  describe('loadProfile', () => {
    it('should load valid profile', async () => {
      const profile = await profileManager.loadProfile('typescript-node');

      expect(profile).toBeDefined();
      expect(profile.metadata.name).toBe('typescript-node');
      expect(profile.templates).toBeDefined();
    });

    it('should throw error for non-existent profile', async () => {
      await expect(profileManager.loadProfile('nonexistent')).rejects.toThrow(/not found/);
    });

    it('should include all required template files', async () => {
      const profile = await profileManager.loadProfile('typescript-node');

      expect(profile.templates.flake).toBeTruthy();
      expect(profile.templates.static).toBeInstanceOf(Array);
      expect(profile.templates.scaffold).toBeInstanceOf(Array);
      expect(profile.templates.hooks).toBeInstanceOf(Array);
    });
  });

  describe('validateProfile', () => {
    it('should validate correct profile structure', async () => {
      const profile = await profileManager.loadProfile('typescript-node');

      await expect(profileManager.validateProfile(profile)).resolves.not.toThrow();
    });
  });
});
```

---

## Integration Tests

### createDevshell Integration Test

**File**: `tests/integration/createDevshell.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createDevshell } from '../../src/tools/createDevshell';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('createDevshell integration', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-integration-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should create complete typescript-node project', async () => {
    const projectPath = path.join(tempDir, 'my-project');

    const result = await createDevshell({
      projectPath,
      profile: 'typescript-node',
    });

    expect(result.success).toBe(true);
    expect(result.filesCreated).toContain('flake.nix');
    expect(result.filesCreated).toContain('package.json');
    expect(result.filesCreated).toContain('tsconfig.json');

    // Verify files exist
    await expect(fs.access(path.join(projectPath, 'flake.nix'))).resolves.not.toThrow();
    await expect(fs.access(path.join(projectPath, 'package.json'))).resolves.not.toThrow();
    await expect(fs.access(path.join(projectPath, '.envrc'))).resolves.not.toThrow();
  });

  it('should respect skipIfExists for existing files', async () => {
    const projectPath = path.join(tempDir, 'existing-project');
    await fs.mkdir(projectPath);
    await fs.writeFile(path.join(projectPath, 'package.json'), '{"name":"existing"}');

    const result = await createDevshell({
      projectPath,
      profile: 'typescript-node',
    });

    expect(result.success).toBe(true);
    expect(result.filesSkipped).toContain('package.json');

    // Verify original file not overwritten
    const content = await fs.readFile(path.join(projectPath, 'package.json'), 'utf-8');
    expect(content).toContain('existing');
  });

  it('should apply configuration from options', async () => {
    const projectPath = path.join(tempDir, 'configured-project');

    await createDevshell({
      projectPath,
      profile: 'typescript-node',
      options: {
        nodeVersion: '22',
        framework: 'fastify',
      },
    });

    const flakeContent = await fs.readFile(path.join(projectPath, 'flake.nix'), 'utf-8');
    expect(flakeContent).toContain('nodejs_22');

    const indexContent = await fs.readFile(path.join(projectPath, 'src/index.ts'), 'utf-8');
    expect(indexContent).toContain('Fastify');
  });

  it('should initialize git repository', async () => {
    const projectPath = path.join(tempDir, 'git-project');

    await createDevshell({
      projectPath,
      profile: 'python-fastapi',
    });

    const gitDir = path.join(projectPath, '.git');
    const stats = await fs.stat(gitDir);
    expect(stats.isDirectory()).toBe(true);
  });

  it('should create all four profile types successfully', async () => {
    const profiles = ['typescript-node', 'angular-frontend', 'python-fastapi', 'java-spring-boot'];

    for (const profile of profiles) {
      const projectPath = path.join(tempDir, profile);

      const result = await createDevshell({
        projectPath,
        profile,
      });

      expect(result.success).toBe(true);
      expect(result.filesCreated.length).toBeGreaterThan(0);
    }
  });
});
```

### Configuration Override Test

**File**: `tests/integration/configOverrides.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createDevshell } from '../../src/tools/createDevshell';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('configuration override integration', () => {
  let tempDir: string;
  let userConfigDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-config-'));
    userConfigDir = path.join(tempDir, '.config', 'nix-devshell-mcp');
    await fs.mkdir(userConfigDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should use user config as defaults', async () => {
    const userConfig = {
      author: 'Test User',
      email: 'test@example.com',
      defaults: {
        nodeVersion: '18',
      },
    };

    await fs.writeFile(
      path.join(userConfigDir, 'config.json'),
      JSON.stringify(userConfig)
    );

    // Mock getUserConfigPath to return our test config
    process.env.HOME = tempDir;

    const projectPath = path.join(tempDir, 'project');
    await createDevshell({
      projectPath,
      profile: 'typescript-node',
    });

    const packageJson = JSON.parse(
      await fs.readFile(path.join(projectPath, 'package.json'), 'utf-8')
    );

    expect(packageJson.author).toContain('Test User');
  });

  it('should allow project config to override user config', async () => {
    const projectPath = path.join(tempDir, 'project');
    await fs.mkdir(projectPath);

    const projectConfig = {
      defaults: {
        nodeVersion: '22',
      },
    };

    await fs.writeFile(
      path.join(projectPath, 'devshell-config.json'),
      JSON.stringify(projectConfig)
    );

    await createDevshell({
      projectPath,
      profile: 'typescript-node',
    });

    const flakeContent = await fs.readFile(path.join(projectPath, 'flake.nix'), 'utf-8');
    expect(flakeContent).toContain('nodejs_22');
  });

  it('should allow tool options to override all configs', async () => {
    const projectPath = path.join(tempDir, 'project');

    await createDevshell({
      projectPath,
      profile: 'typescript-node',
      options: {
        nodeVersion: '20', // This should win
      },
    });

    const flakeContent = await fs.readFile(path.join(projectPath, 'flake.nix'), 'utf-8');
    expect(flakeContent).toContain('nodejs_20');
  });
});
```

---

## Test Fixtures

### Test Profile

**File**: `tests/fixtures/profiles/test-profile/profile.json`

```json
{
  "name": "test-profile",
  "displayName": "Test Profile",
  "description": "Profile for testing",
  "version": "1.0.0",
  "supportedOptions": [
    {
      "name": "testOption",
      "type": "string",
      "description": "Test option",
      "required": false,
      "default": "default"
    }
  ],
  "tags": ["test"],
  "examples": ["Test example"],
  "defaults": {
    "testOption": "default"
  }
}
```

### Test Template

**File**: `tests/fixtures/profiles/test-profile/flake.nix.hbs`

```nix
{
  description = "{{project.name}} test";

  outputs = { self, nixpkgs }:
    {
      # Test flake
    };
}
```

### Test Utilities

**File**: `tests/utils/testHelpers.ts`

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';

export async function createTempDir(prefix: string): Promise<string> {
  return await fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

export async function cleanupTempDir(dir: string): Promise<void> {
  await fs.rm(dir, { recursive: true, force: true });
}

export async function readJsonFile(filePath: string): Promise<any> {
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

export async function fileContains(filePath: string, substring: string): Promise<boolean> {
  const content = await fs.readFile(filePath, 'utf-8');
  return content.includes(substring);
}

export function mockEnv(key: string, value: string): () => void {
  const original = process.env[key];
  process.env[key] = value;

  return () => {
    if (original === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = original;
    }
  };
}
```

---

## Coverage Requirements

### Coverage Configuration

**File**: `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/types.ts',
      ],
      lines: 80,
      functions: 85,
      branches: 75,
      statements: 80,
    },
  },
});
```

### Critical Path Coverage

These components must have 100% coverage:

1. **Path Validation** (`src/fs/FilesystemManager.ts` - path validation methods)
2. **Input Validation** (`src/validation/Validator.ts`)
3. **File Writing** (`src/fs/FilesystemManager.ts` - write methods)
4. **Config Merging** (`src/config/ConfigManager.ts` - merge logic)

---

## Running Tests

### Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test tests/unit/config/ConfigManager.test.ts

# Run with coverage
npm run test:coverage

# Run integration tests only
npm test tests/integration

# Run unit tests only
npm test tests/unit
```

### CI Configuration

```yaml
# .github/workflows/test.yml
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
      - run: npm test
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

---

## Test Development Workflow

### Phase 1-3: Unit Tests

1. Uncomment unit tests for component being implemented
2. Run tests: `npm test -- --watch`
3. Implement feature until tests pass
4. Verify coverage: `npm run test:coverage`

### Phase 4-6: Integration Tests

1. Uncomment integration tests
2. Run full test suite
3. Fix any integration issues
4. Add edge case tests as needed

### Phase 7-9: Error Scenarios

1. Add tests for error paths
2. Test boundary conditions
3. Test invalid inputs
4. Ensure error messages are helpful

---

**Document Owner**: QA Team
**Review Cycle**: Every sprint
**Next Review**: After Phase 3 completion