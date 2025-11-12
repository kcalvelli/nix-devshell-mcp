# Contributing to nix-devshell-mcp

Thank you for your interest in contributing to nix-devshell-mcp! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Code Style](#code-style)
- [Pull Request Process](#pull-request-process)
- [Adding New Profiles](#adding-new-profiles)

## Code of Conduct

This project follows a professional and respectful code of conduct. Please:

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the technical merits of contributions
- Help maintain a welcoming environment

## Getting Started

Before contributing, please:

1. Check existing [issues](https://github.com/kcalvelli/nix-devshell-mcp/issues) and [pull requests](https://github.com/kcalvelli/nix-devshell-mcp/pulls)
2. Read the [README.md](README.md) to understand the project
3. Review the [specification documents](.) for detailed design information
4. Set up your development environment

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git
- (Optional) Nix with flakes enabled for testing generated environments

### Installation

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/nix-devshell-mcp.git
cd nix-devshell-mcp

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

## Project Structure

```
nix-devshell-mcp/
├── src/                 # Source code
│   ├── config/         # Configuration management
│   ├── fs/             # Filesystem operations
│   ├── profiles/       # Profile loading
│   ├── templates/      # Template rendering
│   ├── tools/          # Orchestration layer
│   ├── utils/          # Error handling, logging
│   ├── validation/     # Input validation
│   └── index.ts        # MCP server entry point
├── templates/          # Profile templates
│   ├── typescript-node/
│   ├── python-fastapi/
│   ├── angular-frontend/
│   └── java-spring-boot/
├── tests/              # Test suite
└── docs/               # Specifications
```

## Development Workflow

### 1. Create a Branch

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Or a bugfix branch
git checkout -b fix/issue-description
```

### 2. Make Changes

- Follow the existing code style
- Write or update tests for your changes
- Update documentation as needed
- Keep commits focused and atomic

### 3. Test Your Changes

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run linter
npm run lint

# Format code
npm run format
```

### 4. Commit Your Changes

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add support for XYZ"
```

Follow conventional commit format:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `test:` Test additions or changes
- `refactor:` Code refactoring
- `chore:` Maintenance tasks

## Testing

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm test -- --watch

# Specific test file
npm test -- tests/config/ConfigManager.test.ts

# Coverage report
npm run test:coverage
```

### Writing Tests

- Place tests in `tests/` directory mirroring `src/` structure
- Use descriptive test names
- Follow AAA pattern: Arrange, Act, Assert
- Use proper cleanup in `beforeEach` and `afterEach`
- Aim for high coverage (target: 80%+)

Example:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('MyComponent', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should do something specific', () => {
    // Arrange
    const input = { value: 'test' };

    // Act
    const result = myFunction(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

## Code Style

### TypeScript Guidelines

- Use TypeScript strict mode
- Provide explicit types for public APIs
- Use interfaces over types when possible
- Export types that are part of the public API

### Naming Conventions

- **Classes**: PascalCase (`ConfigManager`)
- **Functions**: camelCase (`loadConfig`)
- **Constants**: UPPER_SNAKE_CASE (`ERROR_CODE`)
- **Interfaces**: PascalCase (`UserConfig`)
- **Files**: Match class/export name (`ConfigManager.ts`)

### Code Organization

- One class per file
- Group related functionality
- Keep functions small and focused
- Add JSDoc comments for public APIs

Example:
```typescript
/**
 * Manages configuration loading and merging.
 */
export class ConfigManager {
  /**
   * Loads user configuration from default location.
   * @returns User configuration or null if not found
   */
  async loadUserConfig(): Promise<UserConfig | null> {
    // Implementation
  }
}
```

### Error Handling

- Use `McpError` for application errors
- Provide descriptive error messages
- Include relevant context in error details
- Log errors appropriately

## Pull Request Process

### Before Submitting

1. Ensure all tests pass
2. Update documentation
3. Add/update tests for changes
4. Run linter and fix issues
5. Rebase on latest master

### PR Description

Include:
- **Purpose**: What does this PR do?
- **Changes**: What was changed?
- **Testing**: How was it tested?
- **Related Issues**: Link to related issues

Example:
```markdown
## Purpose
Adds support for private Maven repositories in java-spring-boot profile

## Changes
- Updated ConfigManager to handle Maven registry URLs
- Modified java-spring-boot flake.nix template
- Added MAVEN_OPTS environment variable support

## Testing
- Added unit tests for Maven registry configuration
- Manually tested with private Artifactory instance
- All existing tests pass

## Related Issues
Closes #42
```

### Review Process

- Maintainers will review your PR
- Address feedback promptly
- Keep discussions focused and constructive
- Be patient - reviews take time

## Adding New Profiles

To add a new development environment profile:

### 1. Create Profile Directory

```bash
mkdir -p templates/your-profile-name
```

### 2. Create profile.json

```json
{
  "metadata": {
    "name": "your-profile-name",
    "displayName": "Display Name",
    "description": "Profile description",
    "version": "1.0.0",
    "supportedOptions": [
      {
        "name": "optionName",
        "type": "string",
        "description": "Option description",
        "required": false,
        "default": "defaultValue"
      }
    ],
    "tags": ["tag1", "tag2"],
    "examples": ["Example use case 1"],
    "postCreate": "post-create.sh"
  },
  "templates": {
    "flake": "flake.nix.hbs",
    "envrc": ".envrc",
    "readme": "README.md.hbs"
  },
  "defaults": {
    "projectName": "my-project"
  }
}
```

### 3. Create Templates

Create all template files referenced in `profile.json`:
- `flake.nix.hbs` - Nix flake (required)
- `.envrc` - direnv configuration
- Other project files with `.hbs` extension

Use Handlebars syntax for templating:
```handlebars
{
  description = "{{description}}";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    # Your flake definition
}
```

### 4. Create Post-Creation Hook (Optional)

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "Running setup for your-profile..."

# Your setup logic

echo "✓ Setup complete!"
```

### 5. Add Tests

Create tests in `tests/profiles/` to verify profile loading and rendering.

### 6. Update Documentation

- Add profile to README.md
- Update relevant specification documents
- Add examples and use cases

### 7. Submit PR

Follow the [Pull Request Process](#pull-request-process) above.

## Questions?

If you have questions:
- Check existing [documentation](.)
- Search [issues](https://github.com/kcalvelli/nix-devshell-mcp/issues)
- Open a new issue for discussion

## License

By contributing, you agree that your contributions will be licensed under the ISC License.

---

Thank you for contributing to nix-devshell-mcp! 🎉
