# Product Requirements Document (PRD)

**Project**: nix-devshell-mcp
**Version**: 1.0.0
**Status**: Specification Phase
**Last Updated**: 2025-11-12

---

## Executive Summary

nix-devshell-mcp is an MCP (Model Context Protocol) server that enables AI assistants to generate production-ready Nix flake development environments from conversational prompts. It bridges the gap between natural language project descriptions and fully-configured, reproducible development environments.

---

## Problem Statement

### Current Pain Points

1. **Setup Complexity**: Developers spend hours configuring new project environments
2. **Inconsistency**: Manual setups lead to "works on my machine" problems
3. **Knowledge Barriers**: Teams must learn Nix flake syntax and best practices
4. **Template Maintenance**: Keeping project templates updated is time-consuming
5. **Enterprise Gaps**: Existing tools don't support private registries and organization-specific configurations

### User Impact

- **Time Loss**: 2-8 hours per project setup
- **Onboarding Friction**: New developers struggle with environment configuration
- **Reproducibility Issues**: Environments drift over time
- **Context Switching**: Developers must switch between coding and infrastructure concerns

---

## Solution

### Product Vision

An MCP server that allows AI assistants to generate Nix flake projects through natural conversation, providing:

- **Instant Setup**: Generate complete projects in seconds
- **Battle-Tested Templates**: Production-ready configurations for common stacks
- **Conversational Interface**: Describe needs in plain English
- **Enterprise Ready**: Support for private registries and organizational policies
- **Reproducible**: Nix ensures identical environments across machines

### How It Works

```
User → AI Assistant → MCP Server → Nix Flake Project
  ↓         ↓              ↓              ↓
 "Need    Analyzes    Renders      Complete dev
  Python   intent     template     environment
  FastAPI             w/configs    ready to use
  project"
```

1. User describes project needs to AI assistant
2. AI assistant calls `create_devshell` MCP tool with appropriate profile
3. Server renders templates with user-specific configurations
4. Complete Nix flake project is created, ready for `direnv allow`

---

## Target Users

### Primary Personas

#### 1. Backend Developer (Sarah)
- **Background**: 5 years experience, Python/Node.js
- **Pain Point**: Spends too much time on project setup
- **Goal**: Start coding business logic immediately
- **Tech Stack**: Python, FastAPI, PostgreSQL
- **Wins With This**: "I went from idea to running tests in 5 minutes"

#### 2. Frontend Developer (Alex)
- **Background**: 3 years experience, Angular/React
- **Pain Point**: Environment inconsistencies across team
- **Goal**: Reproducible builds and deploys
- **Tech Stack**: Angular, TypeScript, Node.js
- **Wins With This**: "Everyone on the team has identical environments"

#### 3. Enterprise Java Developer (Marcus)
- **Background**: 10 years experience, Spring Boot
- **Pain Point**: Corporate proxy and private Maven repos
- **Goal**: Templates that work with enterprise infrastructure
- **Tech Stack**: Java 21, Spring Boot 3, Maven
- **Wins With This**: "Finally, a tool that handles our private registries"

#### 4. DevOps Engineer (Priya)
- **Background**: Platform team, infrastructure focus
- **Pain Point**: Maintaining dozens of project templates
- **Goal**: Standardize environments across organization
- **Tech Stack**: Multi-language (Node, Python, Java)
- **Wins With This**: "One source of truth for all our dev environments"

### Secondary Personas

- **Team Leads**: Need consistent onboarding for new developers
- **Open Source Maintainers**: Want reproducible contributor environments
- **Consultants**: Frequently start new projects across different stacks

---

## User Stories

### Core User Stories

#### US-1: Quick Project Creation
**As a** backend developer
**I want to** create a new Python FastAPI project with a single command
**So that** I can start writing business logic immediately

**Acceptance Criteria**:
- Generate complete project in < 10 seconds
- Include flake.nix, .envrc, and starter code
- Auto-initialize git repository
- Provide clear next steps in README

**Priority**: P0 (MVP)

---

#### US-2: Non-Destructive File Generation
**As a** developer with an existing project
**I want to** add Nix flake support without overwriting my code
**So that** I can adopt Nix gradually

**Acceptance Criteria**:
- Check for existing files before writing
- Skip files that already exist
- Log skipped files for user awareness
- Only create missing components

**Priority**: P0 (MVP)

---

#### US-3: Enterprise Registry Support
**As an** enterprise developer
**I want to** configure private npm/PyPI/Maven registries
**So that** I can use internal packages

**Acceptance Criteria**:
- Support registry URLs in user config
- Support authentication tokens
- Include registry config in generated projects
- Validate registry connectivity

**Priority**: P0 (MVP)

---

#### US-4: Profile Discovery
**As a** developer new to the tool
**I want to** see available project templates
**So that** I know what I can create

**Acceptance Criteria**:
- `list_profiles` tool returns all available profiles
- Each profile includes description and supported options
- Profiles include example use cases
- Metadata includes version and dependencies

**Priority**: P0 (MVP)

---

### Profile-Specific User Stories

#### US-5: TypeScript Node.js Backend
**As a** Node.js developer
**I want to** create a TypeScript backend with Express
**So that** I have a type-safe API server

**Acceptance Criteria**:
- Node.js version selectable (18, 20, 22)
- Express + TypeScript configured
- tsconfig.json with strict mode
- Vitest for testing
- ESLint + Prettier configured
- Optional PostgreSQL in devshell

**Profile**: `typescript-node`
**Priority**: P0 (MVP)

---

#### US-6: Angular Frontend
**As a** frontend developer
**I want to** create an Angular SPA project
**So that** I can build a modern web application

**Acceptance Criteria**:
- Angular CLI configured (version 17+)
- TypeScript with strict mode
- Standalone components structure
- Development server configured
- Build scripts in package.json
- Testing with Jasmine/Karma

**Profile**: `angular-frontend`
**Priority**: P0 (MVP)

---

#### US-7: Python FastAPI Backend
**As a** Python developer
**I want to** create a FastAPI backend with async support
**So that** I can build high-performance APIs

**Acceptance Criteria**:
- Python version selectable (3.10, 3.11, 3.12)
- FastAPI + Uvicorn configured
- Poetry or pip-tools for dependencies
- Pytest with async support
- PostgreSQL driver (asyncpg)
- Alembic for migrations
- Optional PostgreSQL in devshell

**Profile**: `python-fastapi`
**Priority**: P0 (MVP)

---

#### US-8: Java Spring Boot Backend
**As a** Java developer
**I want to** create a Spring Boot backend with Maven
**So that** I can build enterprise Java applications

**Acceptance Criteria**:
- Java version selectable (17, 21)
- Spring Boot 3.x configured
- Maven build system
- Spring Web + Spring Data JPA
- PostgreSQL driver
- JUnit 5 for testing
- application.properties configured

**Profile**: `java-spring-boot`
**Priority**: P0 (MVP)

---

### Configuration User Stories

#### US-9: User-Level Configuration
**As a** developer who uses multiple profiles
**I want to** set default configurations for all projects
**So that** I don't repeat myself

**Acceptance Criteria**:
- Config file at `~/.config/nix-devshell-mcp/config.json`
- Support default author name/email
- Support default registry URLs
- Support profile-specific defaults
- JSON schema validation

**Priority**: P0 (MVP)

---

#### US-10: Project-Level Configuration
**As a** developer working in a team repository
**I want to** commit project-specific MCP configurations
**So that** the team shares settings

**Acceptance Criteria**:
- Config file at `./devshell-config.json`
- Overrides user-level config
- Can be committed to version control
- Supports organization registries
- Validates against schema

**Priority**: P0 (MVP)

---

#### US-11: Configuration Priority
**As a** developer
**I want** clear configuration precedence
**So that** I understand which settings apply

**Acceptance Criteria**:
- Tool invocation params (highest priority)
- Project config (./devshell-config.json)
- User config (~/.config/nix-devshell-mcp/config.json)
- Profile defaults
- System defaults (lowest priority)
- Clear error messages when conflicts arise

**Priority**: P0 (MVP)

---

### Post-Creation User Stories

#### US-12: Git Repository Initialization
**As a** developer
**I want** git automatically initialized
**So that** I can start committing immediately

**Acceptance Criteria**:
- Run `git init` in post-create hook
- Include appropriate .gitignore for profile
- Skip if .git directory already exists
- Log initialization status

**Priority**: P0 (MVP)

---

#### US-13: Dependency Installation Guidance
**As a** developer
**I want** clear instructions for installing dependencies
**So that** I know what to do next

**Acceptance Criteria**:
- Include install commands in post-create.sh (commented)
- Provide README with setup instructions
- Explain why commands are commented (Nix handles packages)
- Document manual installation steps if needed

**Priority**: P0 (MVP)

---

## MVP Scope

### In Scope for MVP

#### Core Functionality
- ✅ Two MCP tools: `create_devshell`, `list_profiles`
- ✅ Four production-ready profiles:
  - typescript-node
  - angular-frontend
  - python-fastapi
  - java-spring-boot
- ✅ Handlebars templating engine
- ✅ JSON schema validation for configs
- ✅ Non-destructive file generation
- ✅ Git repository initialization

#### Configuration System
- ✅ User-level config (`~/.config/nix-devshell-mcp/config.json`)
- ✅ Project-level config (`./devshell-config.json`)
- ✅ Configuration priority and merging
- ✅ Private registry support (npm, PyPI, Maven)

#### Developer Experience
- ✅ Comprehensive error messages
- ✅ Post-creation hooks
- ✅ Generated project READMEs
- ✅ Profile metadata and discovery

#### Quality
- ✅ 80%+ test coverage target
- ✅ TypeScript with strict mode
- ✅ Vitest testing framework
- ✅ Input validation

### Out of Scope for MVP

#### Deferred to Post-MVP
- ❌ Web-based profile builder
- ❌ Custom profile creation via MCP
- ❌ Profile versioning system
- ❌ Automatic dependency updates
- ❌ Docker support
- ❌ CI/CD pipeline generation
- ❌ IDE integration beyond MCP
- ❌ Profile inheritance/composition
- ❌ Template hot-reloading
- ❌ Telemetry and analytics

---

## Success Criteria

### Quantitative Metrics

#### Performance
- **Project Generation**: < 10 seconds for any profile
- **Startup Time**: < 2 seconds for MCP server initialization
- **Memory Usage**: < 100MB RAM during operation

#### Quality
- **Test Coverage**: ≥ 80% line coverage
- **Type Safety**: 0 TypeScript `any` types (excluding external types)
- **Validation**: 100% of inputs validated against schemas

#### Reliability
- **Error Handling**: All errors caught and logged
- **File Safety**: 0% chance of overwriting existing user files
- **Schema Validation**: All configs validated before use

### Qualitative Metrics

#### User Experience
- **Clarity**: Users understand what each profile does without documentation
- **Discoverability**: `list_profiles` provides sufficient information to choose
- **Error Messages**: Users can fix issues without consulting source code
- **Documentation**: Generated READMEs are clear and actionable

#### Code Quality
- **Maintainability**: New profiles can be added in < 4 hours
- **Testability**: Each component has clear test boundaries
- **Readability**: Code follows TypeScript best practices
- **Documentation**: All public APIs documented with TSDoc

#### Enterprise Readiness
- **Registry Support**: Works with common private registry configurations
- **Configuration**: Supports organizational defaults
- **Security**: No credentials in logs or error messages
- **Auditing**: All file operations logged

---

## Non-Functional Requirements

### Performance
- Fast generation: < 10s per project
- Low memory footprint: < 100MB
- Efficient templating: Handlebars compilation caching

### Security
- Input validation: All user inputs validated
- Path traversal protection: No writes outside target directory
- Credential handling: Configs support environment variable references
- Safe defaults: Minimal privileges required

### Reliability
- Atomic operations: All files written atomically
- Error recovery: Graceful handling of filesystem errors
- Validation: Schema-based configuration validation
- Logging: Comprehensive error logging

### Maintainability
- TypeScript: Full type safety
- Testing: 80%+ coverage
- Documentation: TSDoc for all public APIs
- Separation of concerns: Clear module boundaries

### Compatibility
- Node.js: 18.x or higher
- Nix: Flakes-compatible version
- MCP: Protocol version 1.0+
- Operating Systems: Linux, macOS (primary); Windows WSL (secondary)

---

## Dependencies

### Required Dependencies
- `@modelcontextprotocol/sdk` ^1.0.0 - MCP server implementation
- `handlebars` ^4.7.8 - Template rendering
- `ajv` ^8.12.0 - JSON schema validation

### Development Dependencies
- `typescript` ^5.0.0
- `vitest` ^1.0.0
- `@types/node` ^20.0.0
- `@types/handlebars` ^4.1.0

### External Dependencies
- Nix with flakes enabled (user environment)
- direnv (user environment, recommended)
- Git (for repository initialization)

---

## Risks and Mitigations

### Risk 1: Nix Learning Curve
**Probability**: High
**Impact**: Medium
**Mitigation**:
- Provide excellent generated READMEs
- Include getting-started documentation
- Focus on direnv workflow (simpler UX)

### Risk 2: Template Maintenance Burden
**Probability**: Medium
**Impact**: High
**Mitigation**:
- Limit MVP to 4 profiles
- Comprehensive test coverage
- Clear template structure conventions
- Profile validation in CI

### Risk 3: Enterprise Configuration Complexity
**Probability**: Medium
**Impact**: Medium
**Mitigation**:
- Start with simple registry config
- Provide example configurations
- Validate configs with JSON schema
- Document common patterns

### Risk 4: File Overwrite Accidents
**Probability**: Low
**Impact**: Critical
**Mitigation**:
- Always check before writing files
- Log all skipped files
- Comprehensive integration tests
- Clear user communication

---

## Post-MVP Roadmap

### Phase 2: Enhanced Profiles (Months 2-3)
- Rust backend profile
- React frontend profile
- Go backend profile
- Ruby on Rails profile

### Phase 3: Advanced Features (Months 4-5)
- Custom profile creation via MCP tool
- Profile versioning and updates
- Template composition/inheritance
- Docker Compose integration

### Phase 4: Enterprise Features (Months 6-7)
- Organization profile repositories
- SAML/SSO for private registries
- Compliance and audit logging
- Policy enforcement framework

### Phase 5: Developer Experience (Months 8-9)
- Web-based profile builder
- VS Code extension
- Interactive project wizard
- Template hot-reloading

### Phase 6: Ecosystem (Months 10-12)
- Community profile marketplace
- Plugin system for custom hooks
- CI/CD pipeline generation
- Deployment target templates

---

## Open Questions

### Q1: Should we support Nix-only users who don't use direnv?
**Status**: To be resolved in Phase 1
**Impact**: Medium
**Options**:
- A) Focus on direnv workflow only (simpler)
- B) Support both `nix develop` and direnv (more complex)
**Recommendation**: Start with direnv-focused, add nix develop docs later

### Q2: How should we handle flake.lock in generated projects?
**Status**: To be resolved in Phase 1
**Impact**: Low
**Options**:
- A) Generate flake.lock with pinned versions
- B) Let user run `nix flake lock` after generation
- C) Make it configurable
**Recommendation**: Option B (user runs nix flake lock)

### Q3: Should post-create hooks run automatically or require user consent?
**Status**: To be resolved in Phase 2
**Impact**: Medium
**Options**:
- A) Always run automatically
- B) Prompt user via MCP
- C) Never run automatically (current approach)
**Recommendation**: Start with C, revisit based on feedback

---

## Glossary

- **MCP**: Model Context Protocol - Protocol for AI assistant tool integration
- **Nix Flake**: Declarative, reproducible Nix configuration format
- **direnv**: Tool for automatically loading environment variables per directory
- **devshell**: Development shell environment with specific tools and dependencies
- **Profile**: Template for a specific technology stack (e.g., typescript-node)
- **Scaffold**: Starter application code included with a profile
- **Post-create hook**: Script that runs after project generation

---

## Appendix: User Journey Maps

### Journey 1: First-Time User (Sarah - Python Developer)

1. **Discovery**: Hears about tool from colleague
2. **Installation**: Adds MCP server to Claude Desktop config
3. **Exploration**: Asks Claude "What kind of projects can you create?"
4. **Creation**: "Create a Python FastAPI project called my-api"
5. **Activation**: cd my-api && direnv allow
6. **Development**: Starts writing endpoints immediately
7. **Success**: "This saved me 3 hours of setup!"

### Journey 2: Enterprise User (Marcus - Java Developer)

1. **Onboarding**: Company provides MCP server config
2. **Configuration**: Creates ~/.config/nix-devshell-mcp/config.json with corporate settings
3. **Creation**: "Create a Spring Boot microservice"
4. **Validation**: Checks that private Maven repos are configured
5. **Customization**: Adjusts pom.xml for company standards
6. **Sharing**: Commits devshell-config.json for team
7. **Adoption**: Rest of team uses same configuration

### Journey 3: Team Lead (Priya - DevOps)

1. **Evaluation**: Tests tool with various profiles
2. **Standardization**: Creates organization config template
3. **Documentation**: Writes internal guide for developers
4. **Rollout**: Introduces tool in team meeting
5. **Support**: Helps developers with initial setup
6. **Iteration**: Gathers feedback and adjusts configs
7. **Success**: "Onboarding time cut from 1 day to 1 hour"

---

**Document Owner**: Development Team
**Review Cycle**: Every sprint
**Next Review**: After Phase 1 implementation