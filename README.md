# nix-devshell-mcp

**Model Context Protocol (MCP) Server for Generating Nix Flake Development Environments**

This MCP server enables AI assistants to generate fully-configured Nix flake development environments from conversational prompts. It provides a bridge between natural language descriptions of development needs and production-ready Nix devshell configurations.

## Quick Start

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Configure your MCP client to use this server
# Add to your Claude Desktop config (~/.config/Claude/claude_desktop_config.json):
{
  "mcpServers": {
    "nix-devshell": {
      "command": "node",
      "args": ["/path/to/nix-devshell-mcp/build/index.js"]
    }
  }
}
```

## What This Project Does

The nix-devshell-mcp server allows AI assistants to:

1. **Generate Nix flake projects** from simple descriptions
2. **Use battle-tested templates** for common tech stacks
3. **Customize configurations** via conversational parameters
4. **Support enterprise workflows** including private registries
5. **Provide consistent, reproducible** development environments

### Example Usage

```
User: "Create a TypeScript backend project with Node 20 and PostgreSQL 16"
AI: *Uses create_devshell tool with typescript-node profile*
Result: Complete Nix flake project ready for direnv activation
```

## MVP Profiles

This server includes four production-ready templates:

- **typescript-node** - Node.js/TypeScript backend with Express
- **angular-frontend** - Angular SPA with TypeScript
- **python-fastapi** - Python FastAPI backend with PostgreSQL support
- **java-spring-boot** - Java Spring Boot backend with Maven

## Documentation Index

This repository contains comprehensive specifications for the entire project:

### Core Documentation

- **[README.md](README.md)** (this file) - Project overview and navigation
- **[SUMMARY.md](SUMMARY.md)** - Executive summary and next steps
- **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Quick reference for common tasks

### Planning & Requirements

- **[PRD.md](PRD.md)** - Product Requirements Document
  - Problem statement and solution
  - Target users and use cases
  - User stories for each profile
  - MVP scope and success criteria
  - Post-MVP roadmap

### Technical Specifications

- **[TECHNICAL_SPEC.md](TECHNICAL_SPEC.md)** - Complete technical architecture
  - System architecture diagram
  - Component breakdown and responsibilities
  - Data models and interfaces
  - Template structure conventions
  - Error handling and security

- **[API_SPEC.md](API_SPEC.md)** - MCP tool specifications
  - `create_devshell` tool API
  - `list_profiles` tool API
  - Profile-specific options
  - Error codes and examples

- **[TEMPLATE_SPEC.md](TEMPLATE_SPEC.md)** - Complete template implementations
  - Full template code for all 4 profiles
  - Handlebars templates with proper syntax
  - Scaffold files and starter code
  - Post-creation hooks

- **[CONFIG_SCHEMA.md](CONFIG_SCHEMA.md)** - Configuration system
  - JSON schema specification
  - Configuration merge logic
  - Validation rules
  - Example configurations

- **[TEST_SPEC.md](TEST_SPEC.md)** - Testing strategy
  - Unit test specifications
  - Integration test strategy
  - Test fixtures and utilities
  - Coverage requirements (80%+ target)

### Implementation

- **[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)** - Step-by-step implementation guide
  - 9 detailed implementation phases
  - File-by-file creation instructions
  - Timeline estimates (23-31 hours)
  - Development tips and gotchas

- **[PROJECT_STRUCTURE.txt](PROJECT_STRUCTURE.txt)** - Visual project structure
  - Complete directory tree
  - File organization
  - Module relationships

## Key Features

### Smart File Handling
- Non-destructive: Won't overwrite existing project files
- Selective generation: Only creates missing files
- Git-aware: Auto-initializes repositories

### Flexible Configuration
- **User-level config**: `~/.config/nix-devshell-mcp/config.json`
- **Project-level config**: `./devshell-config.json`
- **Priority system**: Tool params > project config > user config > defaults

### Enterprise Support
- Private npm registry configuration
- Private PyPI index support
- Maven repository configuration
- Organization-specific conventions

### Developer Experience
- Handlebars templating with helpers
- JSON schema validation
- Comprehensive error messages
- Post-creation hooks for automation

## Technology Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.x
- **MCP SDK**: @modelcontextprotocol/sdk ^1.0.0
- **Templating**: Handlebars ^4.7.8
- **Validation**: AJV ^8.12.0
- **Testing**: Vitest ^1.0.0
- **Target Environment**: Nix flakes + direnv

## Project Status

**Current Phase**: Specification Complete

This repository contains complete specifications ready for implementation. All 11 specification documents have been created with sufficient detail for development to begin.

**Estimated Implementation Time**: 23-31 hours across 9 phases

## Getting Started with Implementation

1. Read [SUMMARY.md](SUMMARY.md) for project overview
2. Review [PRD.md](PRD.md) to understand requirements
3. Study [TECHNICAL_SPEC.md](TECHNICAL_SPEC.md) for architecture
4. Follow [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) phase by phase
5. Reference [QUICK_REFERENCE.md](QUICK_REFERENCE.md) as needed

## Testing Strategy

- **Target Coverage**: 80%+ line coverage
- **Test Framework**: Vitest with TypeScript support
- **Initial State**: Tests written but commented out
- **Approach**: Uncomment and fix tests as features are implemented

## Contributing

This project follows a specification-driven development approach:

1. All specifications are in the repository root
2. Implementation follows [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)
3. Tests are written alongside features
4. Documentation is updated as features evolve

## License

MIT License

## Support

For questions or issues:
- Review the specification documents first
- Check [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for common patterns
- Refer to [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) for guidance

---

**Next Steps**: Begin implementation by following Phase 1 in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)
