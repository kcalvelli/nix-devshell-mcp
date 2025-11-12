# nix-devshell-mcp

**Model Context Protocol (MCP) Server for Generating Nix Flake Development Environments**

[![Tests](https://img.shields.io/badge/tests-104%20passing-brightgreen)]()
[![Coverage](https://img.shields.io/badge/coverage-83%25-green)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)]()
[![License](https://img.shields.io/badge/license-ISC-blue)]()

This MCP server enables AI assistants to generate fully-configured Nix flake development environments from conversational prompts. It provides a bridge between natural language descriptions of development needs and production-ready Nix devshell configurations.

## Features

✨ **Conversational Development Environment Creation**
- Generate complete Nix flake projects from natural language
- 4 production-ready profile templates
- Automatic direnv configuration
- Git repository initialization

🛡️ **Non-Destructive & Safe**
- Never overwrites existing files
- Path traversal protection
- Atomic file writes
- Comprehensive validation

🔧 **Enterprise-Ready**
- Private npm registry support
- Private PyPI index configuration
- Maven repository configuration
- Two-level configuration system (user + project)

🎨 **Highly Customizable**
- Handlebars templating with 11 custom helpers
- JSON schema validation
- Environment variable resolution
- Post-creation hooks

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/kcalvelli/nix-devshell-mcp.git
cd nix-devshell-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

### Configuration

Add to your Claude Desktop config (`~/.config/Claude/claude_desktop_config.json`):

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

### Usage Example

Once configured, you can ask Claude:

```
"Create a TypeScript Node.js project with Node 20 in /home/user/my-app"
```

Claude will use the `create_devshell` tool to generate:
- `flake.nix` - Nix flake with Node.js 20, TypeScript, development tools
- `.envrc` - direnv configuration for automatic activation
- `package.json` - Node.js package configuration with scripts
- `tsconfig.json` - TypeScript compiler configuration
- `src/index.ts` - Starter TypeScript code
- `README.md` - Project documentation

Then simply:
```bash
cd /home/user/my-app
direnv allow
npm install
npm run dev
```

## Available Profiles

### typescript-node
Modern TypeScript + Node.js development with ES modules and strict type checking.

**Includes:**
- Node.js (configurable version, default 20)
- TypeScript 5.x with strict mode
- tsx for development, vitest for testing
- ESLint, Prettier
- Package manager choice (npm/yarn/pnpm)

**Use cases:** REST APIs, CLI tools, backend services, GraphQL servers

### python-fastapi
Python FastAPI development with async support and automatic OpenAPI documentation.

**Includes:**
- Python (configurable version, default 3.11)
- FastAPI, Uvicorn, Pydantic
- pytest, httpx for testing
- Black, Flake8, mypy
- Virtual environment auto-activation

**Use cases:** REST APIs, microservices, async web applications

### angular-frontend
Angular 17+ frontend development with standalone components.

**Includes:**
- Node.js 20
- Angular CLI 17+
- TypeScript, standalone components
- Development server with hot reload
- Testing framework setup

**Use cases:** Single-page applications, progressive web apps, enterprise frontends

### java-spring-boot
Enterprise Java development with Spring Boot 3.x and Maven.

**Includes:**
- JDK (configurable version, default 17)
- Spring Boot 3.2.0
- Maven build tool
- REST controller scaffolding
- Spring Boot DevTools

**Use cases:** Enterprise backends, microservices, RESTful APIs, web applications

## Configuration

### User Configuration
Create `~/.config/nix-devshell-mcp/config.json`:

```json
{
  "author": "Your Name",
  "email": "your.email@example.com",
  "gitAutoInit": true,
  "defaults": {
    "nodeVersion": "20",
    "pythonVersion": "311",
    "javaVersion": "17"
  },
  "privateRegistry": {
    "npm": {
      "registry": "https://registry.company.com",
      "authToken": "${NPM_TOKEN}"
    }
  }
}
```

### Project Configuration
Create `devshell-config.json` in your project:

```json
{
  "projectName": "my-awesome-project",
  "description": "An awesome project",
  "nodeVersion": "20",
  "author": "Team Name"
}
```

### Configuration Priority
Tool options > Project config > User config > Profile defaults

### Environment Variables
Use `${VAR_NAME}` syntax in configs to reference environment variables:
```json
{
  "npmRegistry": "${PRIVATE_NPM_REGISTRY}",
  "authToken": "${NPM_TOKEN}"
}
```

## MCP Tools

### `create_devshell`
Creates a development environment from a profile template.

**Parameters:**
- `projectPath` (required): Absolute path to project directory
- `profile` (required): Profile name (typescript-node, python-fastapi, angular-frontend, java-spring-boot)
- `options` (optional): Configuration overrides

**Example:**
```json
{
  "projectPath": "/home/user/my-project",
  "profile": "typescript-node",
  "options": {
    "nodeVersion": "20",
    "projectName": "my-api",
    "packageManager": "pnpm"
  }
}
```

### `list_profiles`
Lists all available development environment profiles.

**Returns:**
```json
{
  "profiles": [
    {
      "name": "typescript-node",
      "displayName": "TypeScript + Node.js",
      "description": "Modern TypeScript development...",
      "version": "1.0.0",
      "tags": ["typescript", "nodejs", "backend"]
    }
  ]
}
```

## Development

### Project Structure
```
nix-devshell-mcp/
├── src/
│   ├── config/          # Configuration management
│   ├── fs/              # Filesystem operations
│   ├── profiles/        # Profile loading and management
│   ├── templates/       # Handlebars template rendering
│   ├── tools/           # DevshellTool orchestration
│   ├── utils/           # Error handling, logging
│   ├── validation/      # Input and schema validation
│   └── index.ts         # MCP server entry point
├── templates/           # Profile templates
│   ├── typescript-node/
│   ├── python-fastapi/
│   ├── angular-frontend/
│   └── java-spring-boot/
├── tests/               # Test suite (104 tests, 83% coverage)
└── docs/                # Specification documents
```

### Running Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm test -- --watch
```

### Building
```bash
# Build TypeScript
npm run build

# Development mode (watch)
npm run dev
```

### Linting & Formatting
```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## Architecture

### Core Components

**ConfigManager** - Handles configuration loading, merging, and environment variable resolution.

**FilesystemManager** - Manages file operations with atomic writes, path validation, and non-destructive behavior.

**ProfileManager** - Loads and validates profile templates from the templates directory.

**TemplateRenderer** - Renders Handlebars templates with custom helpers for common transformations.

**Validator** - Performs JSON schema validation using AJV for inputs and configurations.

**DevshellTool** - Orchestrates all components to create complete development environments.

### Handlebars Helpers

The template renderer includes 11 custom helpers:
- `indent` - Indent text by N spaces
- `toJson` - Convert object to JSON string
- `ifEquals` - Conditional comparison
- `joinWith` - Join array with separator
- `ifCond` - Flexible conditional with operators
- `default` - Return default value if falsy
- `lowercase` - Convert to lowercase
- `uppercase` - Convert to uppercase
- `kebabCase` - Convert to kebab-case
- `camelCase` - Convert to camelCase
- `pascalCase` - Convert to PascalCase

## Documentation

### Specification Documents

Comprehensive specifications are available in the repository:

- **[PRD.md](PRD.md)** - Product requirements and user stories
- **[TECHNICAL_SPEC.md](TECHNICAL_SPEC.md)** - System architecture and design
- **[API_SPEC.md](API_SPEC.md)** - MCP tool API specifications
- **[TEMPLATE_SPEC.md](TEMPLATE_SPEC.md)** - Template implementations
- **[CONFIG_SCHEMA.md](CONFIG_SCHEMA.md)** - Configuration system
- **[TEST_SPEC.md](TEST_SPEC.md)** - Testing strategy
- **[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)** - Development phases
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Quick reference guide
- **[SUMMARY.md](SUMMARY.md)** - Executive summary

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Testing

The project includes comprehensive test coverage:
- **104 tests** across 6 test suites
- **83.21%** statement coverage
- **69.05%** branch coverage
- **98.66%** function coverage

Tests cover:
- Configuration management
- Filesystem operations
- Profile loading and validation
- Template rendering
- Input validation
- End-to-end orchestration

## Requirements

- **Node.js**: 18+ required
- **Nix**: with flakes enabled
- **direnv**: for automatic environment activation

## License

ISC

## Support

For issues or questions:
- Check the [documentation](#documentation) first
- Review existing [GitHub issues](https://github.com/kcalvelli/nix-devshell-mcp/issues)
- Create a new issue with detailed information

## Acknowledgments

Built with:
- [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/sdk) - MCP protocol implementation
- [Handlebars](https://handlebarsjs.com/) - Template engine
- [AJV](https://ajv.js.org/) - JSON schema validation
- [Vitest](https://vitest.dev/) - Testing framework

---

**Status**: ✅ Production Ready

All phases complete: Core implementation, profiles, tests, documentation.
