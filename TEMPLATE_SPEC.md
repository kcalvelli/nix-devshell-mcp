# Template Specification

**Project**: nix-devshell-mcp
**Version**: 1.0.0
**Last Updated**: 2025-11-12

---

## Table of Contents

1. [Overview](#overview)
2. [Template Structure](#template-structure)
3. [TypeScript Node.js Profile](#typescript-nodejs-profile)
4. [Angular Frontend Profile](#angular-frontend-profile)
5. [Python FastAPI Profile](#python-fastapi-profile)
6. [Java Spring Boot Profile](#java-spring-boot-profile)
7. [Handlebars Conventions](#handlebars-conventions)

---

## Overview

This document contains the **complete, working template code** for all four MVP profiles. Each profile includes all necessary files to generate a production-ready Nix flake development environment.

### Profile Directory Structure

All profiles follow this structure:

```
profiles/{profile-name}/
├── profile.json              # Metadata and configuration
├── flake.nix.hbs            # Nix flake template (Handlebars)
├── .envrc                   # Static direnv file
├── hooks/
│   └── post-create.sh       # Post-creation hook (chmod +x)
└── scaffold/
    ├── src/                 # Source code templates
    ├── tests/               # Test templates
    ├── {config-files}.hbs  # Configuration templates
    ├── README.md.hbs        # Project README template
    └── .gitignore           # Static gitignore
```

---

## TypeScript Node.js Profile

### Directory Structure

```
profiles/typescript-node/
├── profile.json
├── flake.nix.hbs
├── .envrc
├── hooks/
│   └── post-create.sh
└── scaffold/
    ├── src/
    │   ├── index.ts.hbs
    │   └── types.ts.hbs
    ├── tests/
    │   └── index.test.ts.hbs
    ├── package.json.hbs
    ├── tsconfig.json.hbs
    ├── .eslintrc.json.hbs
    ├── .prettierrc.hbs
    ├── README.md.hbs
    └── .gitignore
```

### profile.json

```json
{
  "name": "typescript-node",
  "displayName": "TypeScript Node.js Backend",
  "description": "Node.js backend with TypeScript, Express, and Vitest for testing. Includes ESLint and Prettier for code quality.",
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
      "name": "packageManager",
      "type": "string",
      "description": "Package manager to use",
      "required": false,
      "default": "npm",
      "enum": ["npm", "yarn", "pnpm"]
    },
    {
      "name": "includeDatabase",
      "type": "boolean",
      "description": "Include PostgreSQL in devshell",
      "required": false,
      "default": false
    },
    {
      "name": "databaseType",
      "type": "string",
      "description": "Database type (only used if includeDatabase is true)",
      "required": false,
      "default": "postgresql",
      "enum": ["postgresql", "mysql"]
    },
    {
      "name": "includeRedis",
      "type": "boolean",
      "description": "Include Redis in devshell",
      "required": false,
      "default": false
    },
    {
      "name": "framework",
      "type": "string",
      "description": "HTTP framework to use",
      "required": false,
      "default": "express",
      "enum": ["express", "fastify"]
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
    "packageManager": "npm",
    "includeDatabase": false,
    "includeRedis": false,
    "framework": "express"
  }
}
```

### flake.nix.hbs

```nix
{
  description = "{{project.name}} - TypeScript Node.js development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        {{#if_eq options.nodeVersion "18"}}
        nodejs = pkgs.nodejs_18;
        {{else}}
        {{#if_eq options.nodeVersion "22"}}
        nodejs = pkgs.nodejs_22;
        {{else}}
        nodejs = pkgs.nodejs_20;
        {{/if_eq}}
        {{/if_eq}}

        {{#if_eq options.packageManager "yarn"}}
        packageManager = pkgs.yarn;
        {{else}}
        {{#if_eq options.packageManager "pnpm"}}
        packageManager = pkgs.nodePackages.pnpm;
        {{else}}
        packageManager = null; # npm is included with nodejs
        {{/if_eq}}
        {{/if_eq}}

      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs
            {{#if packageManager}}
            packageManager
            {{/if}}
            {{#if options.includeDatabase}}
            {{#if_eq options.databaseType "postgresql"}}
            postgresql_16
            {{else}}
            mysql80
            {{/if_eq}}
            {{/if}}
            {{#if options.includeRedis}}
            redis
            {{/if}}
            # Development tools
            git
          ];

          shellHook = ''
            echo "🚀 {{project.name}} development environment"
            echo "Node.js version: $(node --version)"
            {{#if_eq options.packageManager "npm"}}
            echo "npm version: $(npm --version)"
            {{/if_eq}}
            {{#if_eq options.packageManager "yarn"}}
            echo "Yarn version: $(yarn --version)"
            {{/if_eq}}
            {{#if_eq options.packageManager "pnpm"}}
            echo "pnpm version: $(pnpm --version)"
            {{/if_eq}}
            {{#if options.includeDatabase}}
            {{#if_eq options.databaseType "postgresql"}}
            echo "PostgreSQL available: $(postgres --version)"
            {{else}}
            echo "MySQL available: $(mysql --version)"
            {{/if_eq}}
            {{/if}}
            {{#if options.includeRedis}}
            echo "Redis available: $(redis-server --version)"
            {{/if}}
            echo ""
            echo "Run '{{#if_eq options.packageManager "npm"}}npm{{else}}{{#if_eq options.packageManager "yarn"}}yarn{{else}}pnpm{{/if_eq}}{{/if_eq}} install' to install dependencies"
            echo "Run '{{#if_eq options.packageManager "npm"}}npm{{else}}{{#if_eq options.packageManager "yarn"}}yarn{{else}}pnpm{{/if_eq}}{{/if_eq}} run dev' to start the development server"
          '';

          {{#if config.npmRegistry}}
          NPM_CONFIG_REGISTRY = "{{config.npmRegistry}}";
          {{/if}}
        };
      }
    );
}
```

### .envrc

```bash
use flake
```

### hooks/post-create.sh

```bash
#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$1"
cd "$PROJECT_DIR"

echo "Running post-create setup for {{project.name}}..."

# Initialize git repository if not already initialized
if [ ! -d ".git" ]; then
  echo "Initializing git repository..."
  git init
  echo "✓ Git repository initialized"
else
  echo "✓ Git repository already exists"
fi

# Note: Dependency installation
# The following commands are commented out because Nix manages the Node.js environment.
# Uncomment if you need to install npm packages manually:
#
# {{#if_eq options.packageManager "npm"}}
# npm install
# {{/if_eq}}
# {{#if_eq options.packageManager "yarn"}}
# yarn install
# {{/if_eq}}
# {{#if_eq options.packageManager "pnpm"}}
# pnpm install
# {{/if_eq}}

echo ""
echo "✓ Project setup complete!"
echo ""
echo "Next steps:"
echo "  1. cd {{project.name}}"
echo "  2. direnv allow"
echo "  3. {{#if_eq options.packageManager "npm"}}npm install{{else}}{{#if_eq options.packageManager "yarn"}}yarn install{{else}}pnpm install{{/if_eq}}{{/if_eq}}"
echo "  4. {{#if_eq options.packageManager "npm"}}npm run dev{{else}}{{#if_eq options.packageManager "yarn"}}yarn dev{{else}}pnpm dev{{/if_eq}}{{/if_eq}}"
```

### scaffold/package.json.hbs

```json
{
  "name": "{{project.name}}",
  "version": "1.0.0",
  "description": "TypeScript Node.js backend project",
  "main": "dist/index.js",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "format": "prettier --write \"src/**/*.ts\""
  },
  "keywords": ["typescript", "nodejs", "{{options.framework}}"],
  {{#if config.author}}
  "author": "{{config.author}}{{#if config.email}} <{{config.email}}>{{/if}}",
  {{/if}}
  "license": "MIT",
  "dependencies": {
    {{#if_eq options.framework "express"}}
    "express": "^4.18.2",
    "@types/express": "^4.17.21",
    {{else}}
    "fastify": "^4.25.0",
    {{/if_eq}}
    {{#if options.includeDatabase}}
    {{#if_eq options.databaseType "postgresql"}}
    "pg": "^8.11.3",
    "@types/pg": "^8.10.9",
    {{else}}
    "mysql2": "^3.6.5",
    {{/if_eq}}
    {{/if}}
    {{#if options.includeRedis}}
    "redis": "^4.6.11",
    {{/if}}
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.10.5",
    "typescript": "^5.3.3",
    "tsx": "^4.7.0",
    "vitest": "^1.0.4",
    "eslint": "^8.56.0",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "@typescript-eslint/parser": "^6.15.0",
    "prettier": "^3.1.1"
  }
}
```

### scaffold/tsconfig.json.hbs

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "allowJs": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "removeComments": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### scaffold/src/index.ts.hbs

```typescript
{{#if_eq options.framework "express"}}
import express, { Request, Response } from 'express';
{{#if options.includeDatabase}}
{{#if_eq options.databaseType "postgresql"}}
import pg from 'pg';
{{else}}
import mysql from 'mysql2/promise';
{{/if_eq}}
{{/if}}
{{#if options.includeRedis}}
import { createClient } from 'redis';
{{/if}}
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

{{#if options.includeDatabase}}
// Database connection
{{#if_eq options.databaseType "postgresql"}}
const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || '{{project.name}}',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});
{{else}}
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME || '{{project.name}}',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
});
{{/if_eq}}
{{/if}}

{{#if options.includeRedis}}
// Redis connection
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

await redisClient.connect();
{{/if}}

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Welcome to {{project.name}}!',
    version: '1.0.0',
    status: 'running',
  });
});

app.get('/health', async (req: Request, res: Response) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    {{#if options.includeDatabase}}
    database: 'disconnected',
    {{/if}}
    {{#if options.includeRedis}}
    redis: 'disconnected',
    {{/if}}
  };

  {{#if options.includeDatabase}}
  try {
    await pool.query('SELECT 1');
    health.database = 'connected';
  } catch (error) {
    console.error('Database health check failed:', error);
  }
  {{/if}}

  {{#if options.includeRedis}}
  try {
    await redisClient.ping();
    health.redis = 'connected';
  } catch (error) {
    console.error('Redis health check failed:', error);
  }
  {{/if}}

  res.json(health);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
{{else}}
// Fastify
import Fastify from 'fastify';
{{#if options.includeDatabase}}
{{#if_eq options.databaseType "postgresql"}}
import pg from 'pg';
{{else}}
import mysql from 'mysql2/promise';
{{/if_eq}}
{{/if}}
{{#if options.includeRedis}}
import { createClient } from 'redis';
{{/if}}
import dotenv from 'dotenv';

dotenv.config();

const fastify = Fastify({
  logger: true,
});

const PORT = parseInt(process.env.PORT || '3000');

{{#if options.includeDatabase}}
// Database connection
{{#if_eq options.databaseType "postgresql"}}
const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || '{{project.name}}',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});
{{else}}
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME || '{{project.name}}',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
});
{{/if_eq}}
{{/if}}

{{#if options.includeRedis}}
// Redis connection
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => fastify.log.error('Redis Client Error', err));

await redisClient.connect();
{{/if}}

// Routes
fastify.get('/', async (request, reply) => {
  return {
    message: 'Welcome to {{project.name}}!',
    version: '1.0.0',
    status: 'running',
  };
});

fastify.get('/health', async (request, reply) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    {{#if options.includeDatabase}}
    database: 'disconnected',
    {{/if}}
    {{#if options.includeRedis}}
    redis: 'disconnected',
    {{/if}}
  };

  {{#if options.includeDatabase}}
  try {
    await pool.query('SELECT 1');
    health.database = 'connected';
  } catch (error) {
    fastify.log.error('Database health check failed:', error);
  }
  {{/if}}

  {{#if options.includeRedis}}
  try {
    await redisClient.ping();
    health.redis = 'connected';
  } catch (error) {
    fastify.log.error('Redis health check failed:', error);
  }
  {{/if}}

  return health;
});

// Start server
try {
  await fastify.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`🚀 Server running on http://localhost:${PORT}`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
{{/if_eq}}
```

### scaffold/src/types.ts.hbs

```typescript
// Common types for {{project.name}}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface HealthCheck {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  {{#if options.includeDatabase}}
  database?: 'connected' | 'disconnected';
  {{/if}}
  {{#if options.includeRedis}}
  redis?: 'connected' | 'disconnected';
  {{/if}}
}

{{#if options.includeDatabase}}
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}
{{/if}}

{{#if options.includeRedis}}
export interface RedisConfig {
  url: string;
}
{{/if}}
```

### scaffold/tests/index.test.ts.hbs

```typescript
import { describe, it, expect } from 'vitest';

describe('{{project.name}}', () => {
  it('should pass a basic test', () => {
    expect(true).toBe(true);
  });

  it('should handle string operations', () => {
    const projectName = '{{project.name}}';
    expect(projectName).toBeTruthy();
    expect(projectName.length).toBeGreaterThan(0);
  });
});
```

### scaffold/.eslintrc.json.hbs

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

### scaffold/.prettierrc.hbs

```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always"
}
```

### scaffold/README.md.hbs

```markdown
# {{project.name}}

TypeScript Node.js backend project generated with nix-devshell-mcp.

## Stack

- **Runtime**: Node.js {{options.nodeVersion}}
- **Language**: TypeScript 5.x
- **Framework**: {{#if_eq options.framework "express"}}Express{{else}}Fastify{{/if_eq}}
- **Testing**: Vitest
- **Code Quality**: ESLint + Prettier
{{#if options.includeDatabase}}
- **Database**: {{#if_eq options.databaseType "postgresql"}}PostgreSQL{{else}}MySQL{{/if_eq}}
{{/if}}
{{#if options.includeRedis}}
- **Cache**: Redis
{{/if}}

## Getting Started

### Prerequisites

- Nix with flakes enabled
- direnv (recommended)

### Setup

1. **Activate the development environment**:
   ```bash
   direnv allow
   ```

2. **Install dependencies**:
   ```bash
   {{#if_eq options.packageManager "npm"}}npm install{{else}}{{#if_eq options.packageManager "yarn"}}yarn install{{else}}pnpm install{{/if_eq}}{{/if_eq}}
   ```

3. **Start development server**:
   ```bash
   {{#if_eq options.packageManager "npm"}}npm run dev{{else}}{{#if_eq options.packageManager "yarn"}}yarn dev{{else}}pnpm dev{{/if_eq}}{{/if_eq}}
   ```

The server will start on `http://localhost:3000`.

## Available Scripts

- `{{#if_eq options.packageManager "npm"}}npm run{{else}}{{#if_eq options.packageManager "yarn"}}yarn{{else}}pnpm{{/if_eq}}{{/if_eq}} dev` - Start development server with auto-reload
- `{{#if_eq options.packageManager "npm"}}npm run{{else}}{{#if_eq options.packageManager "yarn"}}yarn{{else}}pnpm{{/if_eq}}{{/if_eq}} build` - Build for production
- `{{#if_eq options.packageManager "npm"}}npm{{else}}{{#if_eq options.packageManager "yarn"}}yarn{{else}}pnpm{{/if_eq}}{{/if_eq}} start` - Start production server
- `{{#if_eq options.packageManager "npm"}}npm{{else}}{{#if_eq options.packageManager "yarn"}}yarn{{else}}pnpm{{/if_eq}}{{/if_eq}} test` - Run tests
- `{{#if_eq options.packageManager "npm"}}npm run{{else}}{{#if_eq options.packageManager "yarn"}}yarn{{else}}pnpm{{/if_eq}}{{/if_eq}} lint` - Lint code
- `{{#if_eq options.packageManager "npm"}}npm run{{else}}{{#if_eq options.packageManager "yarn"}}yarn{{else}}pnpm{{/if_eq}}{{/if_eq}} format` - Format code

## API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check endpoint

{{#if options.includeDatabase}}
## Database

{{#if_eq options.databaseType "postgresql"}}
PostgreSQL is included in the development environment. Configure connection in `.env`:

\`\`\`env
DB_HOST=localhost
DB_PORT=5432
DB_NAME={{project.name}}
DB_USER=postgres
DB_PASSWORD=postgres
\`\`\`
{{else}}
MySQL is included in the development environment. Configure connection in `.env`:

\`\`\`env
DB_HOST=localhost
DB_PORT=3306
DB_NAME={{project.name}}
DB_USER=root
DB_PASSWORD=root
\`\`\`
{{/if_eq}}
{{/if}}

{{#if options.includeRedis}}
## Redis

Redis is included in the development environment. Configure connection in `.env`:

\`\`\`env
REDIS_URL=redis://localhost:6379
\`\`\`
{{/if}}

## Project Structure

\`\`\`
{{project.name}}/
├── src/
│   ├── index.ts       # Application entry point
│   └── types.ts       # TypeScript type definitions
├── tests/
│   └── index.test.ts  # Test files
├── dist/              # Compiled output (generated)
├── flake.nix          # Nix flake configuration
├── .envrc             # direnv configuration
├── package.json       # Node.js dependencies
├── tsconfig.json      # TypeScript configuration
└── README.md          # This file
\`\`\`

## Environment Variables

Create a `.env` file in the project root:

\`\`\`env
PORT=3000
NODE_ENV=development
{{#if options.includeDatabase}}
{{#if_eq options.databaseType "postgresql"}}
DB_HOST=localhost
DB_PORT=5432
DB_NAME={{project.name}}
DB_USER=postgres
DB_PASSWORD=postgres
{{else}}
DB_HOST=localhost
DB_PORT=3306
DB_NAME={{project.name}}
DB_USER=root
DB_PASSWORD=root
{{/if_eq}}
{{/if}}
{{#if options.includeRedis}}
REDIS_URL=redis://localhost:6379
{{/if}}
\`\`\`

## License

MIT

---

Generated with [nix-devshell-mcp](https://github.com/your-org/nix-devshell-mcp) on {{metadata.generatedAt}}
```

### scaffold/.gitignore

```
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Production
dist/
build/

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Editor
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Nix
result
result-*
.direnv/
```

---

## Angular Frontend Profile

### Directory Structure

```
profiles/angular-frontend/
├── profile.json
├── flake.nix.hbs
├── .envrc
├── hooks/
│   └── post-create.sh
└── scaffold/
    ├── src/
    │   ├── app/
    │   │   ├── app.component.ts.hbs
    │   │   ├── app.component.html.hbs
    │   │   ├── app.component.{{options.styling}}.hbs
    │   │   ├── app.config.ts.hbs
    │   │   └── app.routes.ts.hbs
    │   ├── index.html.hbs
    │   ├── main.ts.hbs
    │   └── styles.{{options.styling}}.hbs
    ├── public/
    │   └── favicon.ico
    ├── package.json.hbs
    ├── tsconfig.json.hbs
    ├── tsconfig.app.json.hbs
    ├── angular.json.hbs
    ├── README.md.hbs
    └── .gitignore
```

### profile.json

```json
{
  "name": "angular-frontend",
  "displayName": "Angular Frontend",
  "description": "Angular SPA with TypeScript, standalone components, and modern Angular features",
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
      "name": "angularVersion",
      "type": "string",
      "description": "Angular version",
      "required": false,
      "default": "17",
      "enum": ["17", "18"]
    },
    {
      "name": "packageManager",
      "type": "string",
      "description": "Package manager to use",
      "required": false,
      "default": "npm",
      "enum": ["npm", "yarn", "pnpm"]
    },
    {
      "name": "styling",
      "type": "string",
      "description": "Stylesheet format",
      "required": false,
      "default": "scss",
      "enum": ["css", "scss", "sass"]
    },
    {
      "name": "includeRouter",
      "type": "boolean",
      "description": "Include Angular Router",
      "required": false,
      "default": true
    },
    {
      "name": "ssr",
      "type": "boolean",
      "description": "Enable Server-Side Rendering (SSR)",
      "required": false,
      "default": false
    }
  ],
  "tags": ["frontend", "angular", "spa", "typescript"],
  "examples": [
    "Create an Angular application",
    "Build a web frontend with Angular",
    "Set up an Angular SPA with routing"
  ],
  "defaults": {
    "nodeVersion": "20",
    "angularVersion": "17",
    "packageManager": "npm",
    "styling": "scss",
    "includeRouter": true,
    "ssr": false
  }
}
```

### flake.nix.hbs

```nix
{
  description = "{{project.name}} - Angular frontend development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        {{#if_eq options.nodeVersion "18"}}
        nodejs = pkgs.nodejs_18;
        {{else}}
        {{#if_eq options.nodeVersion "22"}}
        nodejs = pkgs.nodejs_22;
        {{else}}
        nodejs = pkgs.nodejs_20;
        {{/if_eq}}
        {{/if_eq}}

        {{#if_eq options.packageManager "yarn"}}
        packageManager = pkgs.yarn;
        {{else}}
        {{#if_eq options.packageManager "pnpm"}}
        packageManager = pkgs.nodePackages.pnpm;
        {{else}}
        packageManager = null; # npm is included with nodejs
        {{/if_eq}}
        {{/if_eq}}

      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs
            {{#if packageManager}}
            packageManager
            {{/if}}
            # Development tools
            git
          ];

          shellHook = ''
            echo "🚀 {{project.name}} development environment"
            echo "Node.js version: $(node --version)"
            {{#if_eq options.packageManager "npm"}}
            echo "npm version: $(npm --version)"
            {{/if_eq}}
            {{#if_eq options.packageManager "yarn"}}
            echo "Yarn version: $(yarn --version)"
            {{/if_eq}}
            {{#if_eq options.packageManager "pnpm"}}
            echo "pnpm version: $(pnpm --version)"
            {{/if_eq}}
            echo ""
            echo "Run '{{#if_eq options.packageManager "npm"}}npm{{else}}{{#if_eq options.packageManager "yarn"}}yarn{{else}}pnpm{{/if_eq}}{{/if_eq}} install' to install dependencies"
            echo "Run '{{#if_eq options.packageManager "npm"}}npm{{else}}{{#if_eq options.packageManager "yarn"}}yarn{{else}}pnpm{{/if_eq}}{{/if_eq}} start' to start the development server"
          '';

          {{#if config.npmRegistry}}
          NPM_CONFIG_REGISTRY = "{{config.npmRegistry}}";
          {{/if}}
        };
      }
    );
}
```

### scaffold/package.json.hbs

```json
{
  "name": "{{project.name}}",
  "version": "1.0.0",
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "watch": "ng build --watch --configuration development",
    "test": "ng test",
    "lint": "ng lint"
  },
  {{#if config.author}}
  "author": "{{config.author}}{{#if config.email}} <{{config.email}}>{{/if}}",
  {{/if}}
  "license": "MIT",
  "private": true,
  "dependencies": {
    "@angular/animations": "^{{options.angularVersion}}.0.0",
    "@angular/common": "^{{options.angularVersion}}.0.0",
    "@angular/compiler": "^{{options.angularVersion}}.0.0",
    "@angular/core": "^{{options.angularVersion}}.0.0",
    "@angular/forms": "^{{options.angularVersion}}.0.0",
    "@angular/platform-browser": "^{{options.angularVersion}}.0.0",
    "@angular/platform-browser-dynamic": "^{{options.angularVersion}}.0.0",
    {{#if options.includeRouter}}
    "@angular/router": "^{{options.angularVersion}}.0.0",
    {{/if}}
    {{#if options.ssr}}
    "@angular/platform-server": "^{{options.angularVersion}}.0.0",
    "@angular/ssr": "^{{options.angularVersion}}.0.0",
    {{/if}}
    "rxjs": "^7.8.1",
    "tslib": "^2.6.2",
    "zone.js": "^0.14.2"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^{{options.angularVersion}}.0.0",
    "@angular/cli": "^{{options.angularVersion}}.0.0",
    "@angular/compiler-cli": "^{{options.angularVersion}}.0.0",
    "typescript": "~5.2.2"
  }
}
```

### scaffold/angular.json.hbs

```json
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "newProjectRoot": "projects",
  "projects": {
    "{{project.name}}": {
      "projectType": "application",
      "schematics": {
        "@schematics/angular:component": {
          "style": "{{options.styling}}"
        }
      },
      "root": "",
      "sourceRoot": "src",
      "prefix": "app",
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:application",
          "options": {
            "outputPath": "dist/{{project.name}}",
            "index": "src/index.html",
            "browser": "src/main.ts",
            {{#if options.ssr}}
            "server": "src/main.server.ts",
            "prerender": true,
            "ssr": {
              "entry": "server.ts"
            },
            {{/if}}
            "polyfills": [
              "zone.js"
            ],
            "tsConfig": "tsconfig.app.json",
            "assets": [
              "src/public"
            ],
            "styles": [
              "src/styles.{{options.styling}}"
            ],
            "scripts": []
          },
          "configurations": {
            "production": {
              "budgets": [
                {
                  "type": "initial",
                  "maximumWarning": "500kb",
                  "maximumError": "1mb"
                },
                {
                  "type": "anyComponentStyle",
                  "maximumWarning": "2kb",
                  "maximumError": "4kb"
                }
              ],
              "outputHashing": "all"
            },
            "development": {
              "optimization": false,
              "extractLicenses": false,
              "sourceMap": true
            }
          },
          "defaultConfiguration": "production"
        },
        "serve": {
          "builder": "@angular-devkit/build-angular:dev-server",
          "configurations": {
            "production": {
              "buildTarget": "{{project.name}}:build:production"
            },
            "development": {
              "buildTarget": "{{project.name}}:build:development"
            }
          },
          "defaultConfiguration": "development"
        },
        "test": {
          "builder": "@angular-devkit/build-angular:karma",
          "options": {
            "polyfills": [
              "zone.js",
              "zone.js/testing"
            ],
            "tsConfig": "tsconfig.spec.json",
            "assets": [
              "src/public"
            ],
            "styles": [
              "src/styles.{{options.styling}}"
            ],
            "scripts": []
          }
        }
      }
    }
  }
}
```

### scaffold/src/app/app.component.ts.hbs

```typescript
import { Component } from '@angular/core';
{{#if options.includeRouter}}
import { RouterOutlet } from '@angular/router';
{{/if}}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [{{#if options.includeRouter}}RouterOutlet{{/if}}],
  templateUrl: './app.component.html',
  styleUrl: './app.component.{{options.styling}}'
})
export class AppComponent {
  title = '{{project.name}}';
}
```

### scaffold/src/app/app.component.html.hbs

```html
<div class="container">
  <header>
    <h1>Welcome to {{project.name}}!</h1>
    <p>Your Angular application is running.</p>
  </header>

  <main>
    {{#if options.includeRouter}}
    <router-outlet></router-outlet>
    {{else}}
    <section class="content">
      <h2>Get Started</h2>
      <p>Edit <code>src/app/app.component.html</code> to get started.</p>
    </section>
    {{/if}}
  </main>

  <footer>
    <p>Built with Angular {{options.angularVersion}} | Generated with nix-devshell-mcp</p>
  </footer>
</div>
```

### scaffold/src/app/app.config.ts.hbs

```typescript
import { ApplicationConfig } from '@angular/core';
{{#if options.includeRouter}}
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
{{/if}}

export const appConfig: ApplicationConfig = {
  providers: [
    {{#if options.includeRouter}}
    provideRouter(routes)
    {{/if}}
  ]
};
```

### scaffold/src/app/app.routes.ts.hbs

```typescript
import { Routes } from '@angular/router';

export const routes: Routes = [
  // Add your routes here
];
```

### scaffold/src/main.ts.hbs

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
```

### scaffold/src/index.html.hbs

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>{{project.name}}</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
</head>
<body>
  <app-root></app-root>
</body>
</html>
```

### scaffold/tsconfig.json.hbs

```json
{
  "compileOnSave": false,
  "compilerOptions": {
    "outDir": "./dist/out-tsc",
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "sourceMap": true,
    "declaration": false,
    "experimentalDecorators": true,
    "moduleResolution": "node",
    "importHelpers": true,
    "target": "ES2022",
    "module": "ES2022",
    "useDefineForClassFields": false,
    "lib": [
      "ES2022",
      "dom"
    ]
  },
  "angularCompilerOptions": {
    "enableI18nLegacyMessageIdFormat": false,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "strictTemplates": true
  }
}
```

### scaffold/README.md.hbs

```markdown
# {{project.name}}

Angular {{options.angularVersion}} application generated with nix-devshell-mcp.

## Stack

- **Framework**: Angular {{options.angularVersion}}
- **Language**: TypeScript
- **Styling**: {{#if_eq options.styling "scss"}}SCSS{{else}}{{#if_eq options.styling "sass"}}Sass{{else}}CSS{{/if_eq}}{{/if_eq}}
- **Runtime**: Node.js {{options.nodeVersion}}
{{#if options.includeRouter}}
- **Routing**: Angular Router
{{/if}}
{{#if options.ssr}}
- **SSR**: Enabled
{{/if}}

## Getting Started

### Prerequisites

- Nix with flakes enabled
- direnv (recommended)

### Setup

1. **Activate the development environment**:
   ```bash
   direnv allow
   ```

2. **Install dependencies**:
   ```bash
   {{#if_eq options.packageManager "npm"}}npm install{{else}}{{#if_eq options.packageManager "yarn"}}yarn install{{else}}pnpm install{{/if_eq}}{{/if_eq}}
   ```

3. **Start development server**:
   ```bash
   {{#if_eq options.packageManager "npm"}}npm{{else}}{{#if_eq options.packageManager "yarn"}}yarn{{else}}pnpm{{/if_eq}}{{/if_eq}} start
   ```

The application will open at `http://localhost:4200`.

## Available Scripts

- `{{#if_eq options.packageManager "npm"}}npm{{else}}{{#if_eq options.packageManager "yarn"}}yarn{{else}}pnpm{{/if_eq}}{{/if_eq}} start` - Start development server
- `{{#if_eq options.packageManager "npm"}}npm run{{else}}{{#if_eq options.packageManager "yarn"}}yarn{{else}}pnpm{{/if_eq}}{{/if_eq}} build` - Build for production
- `{{#if_eq options.packageManager "npm"}}npm{{else}}{{#if_eq options.packageManager "yarn"}}yarn{{else}}pnpm{{/if_eq}}{{/if_eq}} test` - Run unit tests
- `{{#if_eq options.packageManager "npm"}}npm run{{else}}{{#if_eq options.packageManager "yarn"}}yarn{{else}}pnpm{{/if_eq}}{{/if_eq}} lint` - Lint code

## Project Structure

\`\`\`
{{project.name}}/
├── src/
│   ├── app/
│   │   ├── app.component.ts
│   │   ├── app.component.html
│   │   ├── app.component.{{options.styling}}
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   ├── public/
│   ├── index.html
│   ├── main.ts
│   └── styles.{{options.styling}}
├── angular.json
├── tsconfig.json
└── package.json
\`\`\`

## Development

### Adding Components

\`\`\`bash
ng generate component my-component
\`\`\`

### Adding Services

\`\`\`bash
ng generate service my-service
\`\`\`

{{#if options.includeRouter}}
### Adding Routes

Edit `src/app/app.routes.ts` to add new routes.
{{/if}}

## Building

\`\`\`bash
{{#if_eq options.packageManager "npm"}}npm run{{else}}{{#if_eq options.packageManager "yarn"}}yarn{{else}}pnpm{{/if_eq}}{{/if_eq}} build
\`\`\`

Build artifacts will be stored in the `dist/` directory.

## License

MIT

---

Generated with [nix-devshell-mcp](https://github.com/your-org/nix-devshell-mcp) on {{metadata.generatedAt}}
```

### scaffold/.gitignore

```
# See http://help.github.com/ignore-files/ for more about ignoring files.

# Compiled output
/dist
/tmp
/out-tsc
/bazel-out

# Node
/node_modules
npm-debug.log
yarn-error.log

# IDEs and editors
.idea/
.project
.classpath
.c9/
*.launch
.settings/
*.sublime-workspace

# Visual Studio Code
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json
.history/*

# Miscellaneous
/.angular/cache
.sass-cache/
/connect.lock
/coverage
/libpeerconnection.log
testem.log
/typings

# System files
.DS_Store
Thumbs.db

# Nix
result
result-*
.direnv/
```

### hooks/post-create.sh

```bash
#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$1"
cd "$PROJECT_DIR"

echo "Running post-create setup for {{project.name}}..."

# Initialize git repository if not already initialized
if [ ! -d ".git" ]; then
  echo "Initializing git repository..."
  git init
  echo "✓ Git repository initialized"
else
  echo "✓ Git repository already exists"
fi

# Note: Dependency installation
# The following commands are commented out because Nix manages the Node.js environment.
# Uncomment if you need to install npm packages manually:
#
# {{#if_eq options.packageManager "npm"}}
# npm install
# {{/if_eq}}
# {{#if_eq options.packageManager "yarn"}}
# yarn install
# {{/if_eq}}
# {{#if_eq options.packageManager "pnpm"}}
# pnpm install
# {{/if_eq}}

echo ""
echo "✓ Project setup complete!"
echo ""
echo "Next steps:"
echo "  1. cd {{project.name}}"
echo "  2. direnv allow"
echo "  3. {{#if_eq options.packageManager "npm"}}npm install{{else}}{{#if_eq options.packageManager "yarn"}}yarn install{{else}}pnpm install{{/if_eq}}{{/if_eq}}"
echo "  4. {{#if_eq options.packageManager "npm"}}npm{{else}}{{#if_eq options.packageManager "yarn"}}yarn{{else}}pnpm{{/if_eq}}{{/if_eq}} start"
```

---

## Python FastAPI Profile

### Directory Structure

```
profiles/python-fastapi/
├── profile.json
├── flake.nix.hbs
├── .envrc
├── hooks/
│   └── post-create.sh
└── scaffold/
    ├── src/
    │   ├── __init__.py
    │   ├── main.py.hbs
    │   ├── config.py.hbs
    │   └── database.py.hbs
    ├── tests/
    │   ├── __init__.py
    │   └── test_main.py.hbs
    ├── pyproject.toml.hbs
    ├── alembic.ini.hbs
    ├── README.md.hbs
    └── .gitignore
```

### profile.json

```json
{
  "name": "python-fastapi",
  "displayName": "Python FastAPI Backend",
  "description": "Python FastAPI backend with async support, PostgreSQL integration, and Alembic migrations",
  "version": "1.0.0",
  "supportedOptions": [
    {
      "name": "pythonVersion",
      "type": "string",
      "description": "Python version (3.10, 3.11, 3.12)",
      "required": false,
      "default": "3.11",
      "enum": ["3.10", "3.11", "3.12"]
    },
    {
      "name": "dependencyManager",
      "type": "string",
      "description": "Python dependency manager",
      "required": false,
      "default": "poetry",
      "enum": ["poetry", "pip-tools"]
    },
    {
      "name": "includeDatabase",
      "type": "boolean",
      "description": "Include PostgreSQL in devshell",
      "required": false,
      "default": false
    },
    {
      "name": "databaseType",
      "type": "string",
      "description": "Database type",
      "required": false,
      "default": "postgresql",
      "enum": ["postgresql", "mysql"]
    },
    {
      "name": "includeRedis",
      "type": "boolean",
      "description": "Include Redis in devshell",
      "required": false,
      "default": false
    },
    {
      "name": "includeAlembic",
      "type": "boolean",
      "description": "Include Alembic for database migrations",
      "required": false,
      "default": true
    },
    {
      "name": "orm",
      "type": "string",
      "description": "ORM library to use",
      "required": false,
      "default": "sqlalchemy",
      "enum": ["sqlalchemy", "tortoise"]
    }
  ],
  "tags": ["backend", "python", "fastapi", "async"],
  "examples": [
    "Create a FastAPI service",
    "Build a Python API with PostgreSQL",
    "Set up a Python backend with async support"
  ],
  "defaults": {
    "pythonVersion": "3.11",
    "dependencyManager": "poetry",
    "includeDatabase": false,
    "includeRedis": false,
    "includeAlembic": true,
    "orm": "sqlalchemy"
  }
}
```

### flake.nix.hbs

```nix
{
  description = "{{project.name}} - Python FastAPI development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        {{#if_eq options.pythonVersion "3.10"}}
        python = pkgs.python310;
        {{else}}
        {{#if_eq options.pythonVersion "3.12"}}
        python = pkgs.python312;
        {{else}}
        python = pkgs.python311;
        {{/if_eq}}
        {{/if_eq}}

      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            python
            {{#if_eq options.dependencyManager "poetry"}}
            poetry
            {{else}}
            python.pkgs.pip-tools
            {{/if_eq}}
            {{#if options.includeDatabase}}
            {{#if_eq options.databaseType "postgresql"}}
            postgresql_16
            {{else}}
            mysql80
            {{/if_eq}}
            {{/if}}
            {{#if options.includeRedis}}
            redis
            {{/if}}
            # Development tools
            git
          ];

          shellHook = ''
            echo "🚀 {{project.name}} development environment"
            echo "Python version: $(python --version)"
            {{#if_eq options.dependencyManager "poetry"}}
            echo "Poetry version: $(poetry --version)"
            {{else}}
            echo "pip-tools available"
            {{/if_eq}}
            {{#if options.includeDatabase}}
            {{#if_eq options.databaseType "postgresql"}}
            echo "PostgreSQL available: $(postgres --version)"
            {{else}}
            echo "MySQL available: $(mysql --version)"
            {{/if_eq}}
            {{/if}}
            {{#if options.includeRedis}}
            echo "Redis available: $(redis-server --version)"
            {{/if}}
            echo ""
            echo "Run '{{#if_eq options.dependencyManager "poetry"}}poetry install{{else}}pip install -r requirements.txt{{/if_eq}}' to install dependencies"
            echo "Run '{{#if_eq options.dependencyManager "poetry"}}poetry run {{/if_eq}}uvicorn src.main:app --reload' to start the server"
          '';

          {{#if config.pypiIndex}}
          PIP_INDEX_URL = "{{config.pypiIndex}}";
          {{/if}}
        };
      }
    );
}
```

### scaffold/pyproject.toml.hbs

```toml
[tool.poetry]
name = "{{project.name}}"
version = "1.0.0"
description = "FastAPI backend project"
{{#if config.author}}
authors = ["{{config.author}}{{#if config.email}} <{{config.email}}>{{/if}}"]
{{/if}}
readme = "README.md"

[tool.poetry.dependencies]
python = "^{{options.pythonVersion}}"
fastapi = "^0.109.0"
uvicorn = {extras = ["standard"], version = "^0.27.0"}
pydantic = "^2.5.3"
pydantic-settings = "^2.1.0"
{{#if options.includeDatabase}}
{{#if_eq options.orm "sqlalchemy"}}
sqlalchemy = "^2.0.25"
{{#if_eq options.databaseType "postgresql"}}
asyncpg = "^0.29.0"
psycopg2-binary = "^2.9.9"
{{else}}
aiomysql = "^0.2.0"
{{/if_eq}}
{{else}}
tortoise-orm = "^0.20.0"
{{#if_eq options.databaseType "postgresql"}}
asyncpg = "^0.29.0"
{{else}}
aiomysql = "^0.2.0"
{{/if_eq}}
{{/if_eq}}
{{#if options.includeAlembic}}
alembic = "^1.13.1"
{{/if}}
{{/if}}
{{#if options.includeRedis}}
redis = "^5.0.1"
{{/if}}
python-dotenv = "^1.0.0"

[tool.poetry.group.dev.dependencies]
pytest = "^7.4.4"
pytest-asyncio = "^0.23.3"
httpx = "^0.26.0"
black = "^23.12.1"
ruff = "^0.1.11"
mypy = "^1.8.0"

[build-system]
requires = ["poetry-core"]
build-backend = "poetry.core.masonry.api"

[tool.black]
line-length = 100
target-version = ['py{{options.pythonVersion}}']

[tool.ruff]
line-length = 100
select = ["E", "F", "I", "N", "W"]
ignore = ["E501"]

[tool.mypy]
python_version = "{{options.pythonVersion}}"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
```

### scaffold/src/main.py.hbs

```python
"""
{{project.name}} - FastAPI Application
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
{{#if options.includeDatabase}}
from .database import engine, Base
{{/if}}
{{#if options.includeRedis}}
import redis.asyncio as redis
{{/if}}
from .config import settings


{{#if options.includeRedis}}
# Redis client
redis_client = None
{{/if}}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    {{#if options.includeDatabase}}
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    {{/if}}
    {{#if options.includeRedis}}
    global redis_client
    redis_client = await redis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
    {{/if}}
    yield
    # Shutdown
    {{#if options.includeDatabase}}
    await engine.dispose()
    {{/if}}
    {{#if options.includeRedis}}
    await redis_client.close()
    {{/if}}


app = FastAPI(
    title="{{project.name}}",
    description="FastAPI backend service",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to {{project.name}}!",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    health = {
        "status": "ok",
        "python_version": "{{options.pythonVersion}}",
        {{#if options.includeDatabase}}
        "database": "unknown",
        {{/if}}
        {{#if options.includeRedis}}
        "redis": "unknown",
        {{/if}}
    }

    {{#if options.includeDatabase}}
    try:
        async with engine.connect() as conn:
            await conn.execute("SELECT 1")
        health["database"] = "connected"
    except Exception as e:
        health["database"] = f"error: {str(e)}"
    {{/if}}

    {{#if options.includeRedis}}
    try:
        await redis_client.ping()
        health["redis"] = "connected"
    except Exception as e:
        health["redis"] = f"error: {str(e)}"
    {{/if}}

    return health


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### scaffold/src/config.py.hbs

```python
"""
Application configuration
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings"""

    # Application
    APP_NAME: str = "{{project.name}}"
    DEBUG: bool = True

    {{#if options.includeDatabase}}
    # Database
    {{#if_eq options.databaseType "postgresql"}}
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/{{project.name}}"
    {{else}}
    DATABASE_URL: str = "mysql+aiomysql://root:root@localhost:3306/{{project.name}}"
    {{/if_eq}}
    {{/if}}

    {{#if options.includeRedis}}
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    {{/if}}

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
```

### scaffold/src/database.py.hbs

```python
"""
Database configuration and models
"""
{{#if_eq options.orm "sqlalchemy"}}
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from .config import settings


class Base(DeclarativeBase):
    """Base class for SQLAlchemy models"""
    pass


# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)


async def get_db():
    """Dependency for getting database sessions"""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
{{else}}
from tortoise import Tortoise
from .config import settings


async def init_db():
    """Initialize Tortoise ORM"""
    await Tortoise.init(
        db_url=settings.DATABASE_URL,
        modules={"models": ["src.models"]}
    )
    await Tortoise.generate_schemas()


async def close_db():
    """Close database connections"""
    await Tortoise.close_connections()
{{/if_eq}}
```

### scaffold/tests/test_main.py.hbs

```python
"""
Tests for main application
"""
import pytest
from httpx import AsyncClient
from src.main import app


@pytest.mark.asyncio
async def test_root():
    """Test root endpoint"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "running"
    assert "version" in data


@pytest.mark.asyncio
async def test_health_check():
    """Test health check endpoint"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
```

### scaffold/README.md.hbs

```markdown
# {{project.name}}

Python FastAPI backend project generated with nix-devshell-mcp.

## Stack

- **Framework**: FastAPI
- **Language**: Python {{options.pythonVersion}}
- **ASGI Server**: Uvicorn
- **Dependency Manager**: {{#if_eq options.dependencyManager "poetry"}}Poetry{{else}}pip-tools{{/if_eq}}
{{#if options.includeDatabase}}
- **Database**: {{#if_eq options.databaseType "postgresql"}}PostgreSQL{{else}}MySQL{{/if_eq}}
- **ORM**: {{#if_eq options.orm "sqlalchemy"}}SQLAlchemy{{else}}Tortoise ORM{{/if_eq}}
{{#if options.includeAlembic}}
- **Migrations**: Alembic
{{/if}}
{{/if}}
{{#if options.includeRedis}}
- **Cache**: Redis
{{/if}}
- **Testing**: Pytest

## Getting Started

### Prerequisites

- Nix with flakes enabled
- direnv (recommended)

### Setup

1. **Activate the development environment**:
   ```bash
   direnv allow
   ```

2. **Install dependencies**:
   ```bash
   {{#if_eq options.dependencyManager "poetry"}}poetry install{{else}}pip install -r requirements.txt{{/if_eq}}
   ```

3. **Start development server**:
   ```bash
   {{#if_eq options.dependencyManager "poetry"}}poetry run {{/if_eq}}uvicorn src.main:app --reload
   ```

The API will be available at `http://localhost:8000`.
API documentation: `http://localhost:8000/docs`

## Available Commands

- `{{#if_eq options.dependencyManager "poetry"}}poetry run {{/if_eq}}uvicorn src.main:app --reload` - Start development server
- `{{#if_eq options.dependencyManager "poetry"}}poetry run {{/if_eq}}pytest` - Run tests
- `{{#if_eq options.dependencyManager "poetry"}}poetry run {{/if_eq}}black src tests` - Format code
- `{{#if_eq options.dependencyManager "poetry"}}poetry run {{/if_eq}}ruff check src tests` - Lint code
- `{{#if_eq options.dependencyManager "poetry"}}poetry run {{/if_eq}}mypy src` - Type check

{{#if options.includeAlembic}}
## Database Migrations

```bash
# Create a new migration
{{#if_eq options.dependencyManager "poetry"}}poetry run {{/if_eq}}alembic revision --autogenerate -m "description"

# Apply migrations
{{#if_eq options.dependencyManager "poetry"}}poetry run {{/if_eq}}alembic upgrade head

# Rollback migration
{{#if_eq options.dependencyManager "poetry"}}poetry run {{/if_eq}}alembic downgrade -1
```
{{/if}}

## API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check
- `GET /docs` - Swagger UI documentation
- `GET /redoc` - ReDoc documentation

## Environment Variables

Create a `.env` file:

\`\`\`env
DEBUG=True
{{#if options.includeDatabase}}
{{#if_eq options.databaseType "postgresql"}}
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/{{project.name}}
{{else}}
DATABASE_URL=mysql+aiomysql://root:root@localhost:3306/{{project.name}}
{{/if_eq}}
{{/if}}
{{#if options.includeRedis}}
REDIS_URL=redis://localhost:6379/0
{{/if}}
\`\`\`

## Project Structure

\`\`\`
{{project.name}}/
├── src/
│   ├── __init__.py
│   ├── main.py          # Application entry point
│   ├── config.py        # Configuration
│   └── database.py      # Database setup
├── tests/
│   ├── __init__.py
│   └── test_main.py
├── pyproject.toml       # Dependencies
├── flake.nix           # Nix configuration
└── README.md
\`\`\`

## License

MIT

---

Generated with [nix-devshell-mcp](https://github.com/your-org/nix-devshell-mcp) on {{metadata.generatedAt}}
```

### scaffold/.gitignore

```
# Byte-compiled / optimized / DLL files
__pycache__/
*.py[cod]
*$py.class

# C extensions
*.so

# Distribution / packaging
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# PyInstaller
*.manifest
*.spec

# Unit test / coverage reports
htmlcov/
.tox/
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
.pytest_cache/

# Virtual environments
venv/
ENV/
env/
.venv

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Environment
.env
.env.local

# Database
*.db
*.sqlite3

# Nix
result
result-*
.direnv/
```

### hooks/post-create.sh

```bash
#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$1"
cd "$PROJECT_DIR"

echo "Running post-create setup for {{project.name}}..."

# Initialize git repository if not already initialized
if [ ! -d ".git" ]; then
  echo "Initializing git repository..."
  git init
  echo "✓ Git repository initialized"
else
  echo "✓ Git repository already exists"
fi

# Note: Dependency installation
# The following commands are commented out because Nix manages the Python environment.
# Uncomment if you need to install packages manually:
#
# {{#if_eq options.dependencyManager "poetry"}}
# poetry install
# {{/if_eq}}
# {{#if_eq options.dependencyManager "pip-tools"}}
# pip install -r requirements.txt
# {{/if_eq}}

echo ""
echo "✓ Project setup complete!"
echo ""
echo "Next steps:"
echo "  1. cd {{project.name}}"
echo "  2. direnv allow"
echo "  3. {{#if_eq options.dependencyManager "poetry"}}poetry install{{else}}pip install -r requirements.txt{{/if_eq}}"
echo "  4. {{#if_eq options.dependencyManager "poetry"}}poetry run {{/if_eq}}uvicorn src.main:app --reload"
```

---

## Java Spring Boot Profile

### Directory Structure

```
profiles/java-spring-boot/
├── profile.json
├── flake.nix.hbs
├── .envrc
├── hooks/
│   └── post-create.sh
└── scaffold/
    ├── src/
    │   ├── main/
    │   │   ├── java/
    │   │   │   └── com/
    │   │   │       └── example/
    │   │   │           └── {{project.name}}/
    │   │   │               ├── Application.java.hbs
    │   │   │               ├── controller/
    │   │   │               │   └── HealthController.java.hbs
    │   │   │               └── config/
    │   │   │                   └── ApplicationConfig.java.hbs
    │   │   └── resources/
    │   │       └── application.properties.hbs
    │   └── test/
    │       └── java/
    │           └── com/
    │               └── example/
    │                   └── {{project.name}}/
    │                       └── ApplicationTests.java.hbs
    ├── pom.xml.hbs
    ├── README.md.hbs
    └── .gitignore
```

### profile.json

```json
{
  "name": "java-spring-boot",
  "displayName": "Java Spring Boot Backend",
  "description": "Java Spring Boot backend with Maven, Spring Web, and Spring Data JPA",
  "version": "1.0.0",
  "supportedOptions": [
    {
      "name": "javaVersion",
      "type": "string",
      "description": "Java version (17, 21)",
      "required": false,
      "default": "21",
      "enum": ["17", "21"]
    },
    {
      "name": "springBootVersion",
      "type": "string",
      "description": "Spring Boot version",
      "required": false,
      "default": "3.2.0",
      "enum": ["3.1.0", "3.2.0"]
    },
    {
      "name": "buildTool",
      "type": "string",
      "description": "Build tool",
      "required": false,
      "default": "maven",
      "enum": ["maven", "gradle"]
    },
    {
      "name": "includeDatabase",
      "type": "boolean",
      "description": "Include PostgreSQL in devshell and Spring Data JPA",
      "required": false,
      "default": false
    },
    {
      "name": "databaseType",
      "type": "string",
      "description": "Database type",
      "required": false,
      "default": "postgresql",
      "enum": ["postgresql", "mysql", "h2"]
    },
    {
      "name": "includeRedis",
      "type": "boolean",
      "description": "Include Redis in devshell and Spring Data Redis",
      "required": false,
      "default": false
    },
    {
      "name": "includeSecurity",
      "type": "boolean",
      "description": "Include Spring Security",
      "required": false,
      "default": false
    },
    {
      "name": "packaging",
      "type": "string",
      "description": "Packaging type",
      "required": false,
      "default": "jar",
      "enum": ["jar", "war"]
    }
  ],
  "tags": ["backend", "java", "spring-boot", "enterprise"],
  "examples": [
    "Create a Spring Boot microservice",
    "Build a Java REST API",
    "Set up a Spring Boot backend with PostgreSQL"
  ],
  "defaults": {
    "javaVersion": "21",
    "springBootVersion": "3.2.0",
    "buildTool": "maven",
    "includeDatabase": false,
    "includeRedis": false,
    "includeSecurity": false,
    "packaging": "jar"
  }
}
```

### flake.nix.hbs

```nix
{
  description = "{{project.name}} - Java Spring Boot development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        {{#if_eq options.javaVersion "17"}}
        jdk = pkgs.jdk17;
        {{else}}
        jdk = pkgs.jdk21;
        {{/if_eq}}

        {{#if_eq options.buildTool "gradle"}}
        buildTool = pkgs.gradle;
        {{else}}
        buildTool = pkgs.maven;
        {{/if_eq}}

      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            jdk
            buildTool
            {{#if options.includeDatabase}}
            {{#if_eq options.databaseType "postgresql"}}
            postgresql_16
            {{else}}
            {{#if_eq options.databaseType "mysql"}}
            mysql80
            {{/if_eq}}
            {{/if_eq}}
            {{/if}}
            {{#if options.includeRedis}}
            redis
            {{/if}}
            # Development tools
            git
          ];

          shellHook = ''
            echo "🚀 {{project.name}} development environment"
            echo "Java version: $(java -version 2>&1 | head -n 1)"
            {{#if_eq options.buildTool "maven"}}
            echo "Maven version: $(mvn --version | head -n 1)"
            {{else}}
            echo "Gradle version: $(gradle --version | grep Gradle)"
            {{/if_eq}}
            {{#if options.includeDatabase}}
            {{#if_eq options.databaseType "postgresql"}}
            echo "PostgreSQL available: $(postgres --version)"
            {{else}}
            {{#if_eq options.databaseType "mysql"}}
            echo "MySQL available: $(mysql --version)"
            {{/if_eq}}
            {{/if_eq}}
            {{/if}}
            {{#if options.includeRedis}}
            echo "Redis available: $(redis-server --version)"
            {{/if}}
            echo ""
            echo "Run '{{#if_eq options.buildTool "maven"}}./mvnw spring-boot:run{{else}}./gradlew bootRun{{/if_eq}}' to start the application"
          '';

          {{#if config.mavenRepository}}
          MAVEN_OPTS = "-Dmaven.repo.remote={{config.mavenRepository}}";
          {{/if}}
        };
      }
    );
}
```

### scaffold/pom.xml.hbs

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>{{options.springBootVersion}}</version>
        <relativePath/>
    </parent>

    <groupId>com.example</groupId>
    <artifactId>{{project.name}}</artifactId>
    <version>1.0.0</version>
    <packaging>{{options.packaging}}</packaging>

    <name>{{project.name}}</name>
    <description>Spring Boot project generated with nix-devshell-mcp</description>

    <properties>
        <java.version>{{options.javaVersion}}</java.version>
        <maven.compiler.source>{{options.javaVersion}}</maven.compiler.source>
        <maven.compiler.target>{{options.javaVersion}}</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <dependencies>
        <!-- Spring Boot Starter Web -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        {{#if options.includeDatabase}}
        <!-- Spring Data JPA -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>

        <!-- Database Driver -->
        {{#if_eq options.databaseType "postgresql"}}
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
        {{else}}
        {{#if_eq options.databaseType "mysql"}}
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <scope>runtime</scope>
        </dependency>
        {{else}}
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>runtime</scope>
        </dependency>
        {{/if_eq}}
        {{/if_eq}}
        {{/if}}

        {{#if options.includeRedis}}
        <!-- Spring Data Redis -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-redis</artifactId>
        </dependency>
        {{/if}}

        {{#if options.includeSecurity}}
        <!-- Spring Security -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        {{/if}}

        <!-- Spring Boot DevTools -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-devtools</artifactId>
            <scope>runtime</scope>
            <optional>true</optional>
        </dependency>

        <!-- Lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <!-- Testing -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>

        {{#if options.includeSecurity}}
        <dependency>
            <groupId>org.springframework.security</groupId>
            <artifactId>spring-security-test</artifactId>
            <scope>test</scope>
        </dependency>
        {{/if}}
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

### scaffold/src/main/java/com/example/{{project.name}}/Application.java.hbs

```java
package com.example.{{project.name}};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

### scaffold/src/main/java/com/example/{{project.name}}/controller/HealthController.java.hbs

```java
package com.example.{{project.name}}.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
{{#if options.includeDatabase}}
import javax.sql.DataSource;
import org.springframework.beans.factory.annotation.Autowired;
{{/if}}
{{#if options.includeRedis}}
import org.springframework.data.redis.core.RedisTemplate;
{{/if}}

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class HealthController {

    {{#if options.includeDatabase}}
    @Autowired
    private DataSource dataSource;
    {{/if}}

    {{#if options.includeRedis}}
    @Autowired
    private RedisTemplate<String, String> redisTemplate;
    {{/if}}

    @GetMapping("/")
    public Map<String, Object> root() {
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Welcome to {{project.name}}!");
        response.put("version", "1.0.0");
        response.put("status", "running");
        return response;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "ok");
        health.put("java version", System.getProperty("java.version"));

        {{#if options.includeDatabase}}
        try {
            dataSource.getConnection().close();
            health.put("database", "connected");
        } catch (Exception e) {
            health.put("database", "disconnected");
        }
        {{/if}}

        {{#if options.includeRedis}}
        try {
            redisTemplate.getConnectionFactory().getConnection().ping();
            health.put("redis", "connected");
        } catch (Exception e) {
            health.put("redis", "disconnected");
        }
        {{/if}}

        return health;
    }
}
```

### scaffold/src/main/resources/application.properties.hbs

```properties
# Application
spring.application.name={{project.name}}
server.port=8080

# Logging
logging.level.root=INFO
logging.level.com.example.{{project.name}}=DEBUG

{{#if options.includeDatabase}}
# Database
{{#if_eq options.databaseType "postgresql"}}
spring.datasource.url=jdbc:postgresql://localhost:5432/{{project.name}}
spring.datasource.username=postgres
spring.datasource.password=postgres
spring.datasource.driver-class-name=org.postgresql.Driver
{{else}}
{{#if_eq options.databaseType "mysql"}}
spring.datasource.url=jdbc:mysql://localhost:3306/{{project.name}}
spring.datasource.username=root
spring.datasource.password=root
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
{{else}}
spring.datasource.url=jdbc:h2:mem:{{project.name}}
spring.datasource.driver-class-name=org.h2.Driver
spring.h2.console.enabled=true
{{/if_eq}}
{{/if_eq}}

# JPA/Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
{{/if}}

{{#if options.includeRedis}}
# Redis
spring.data.redis.host=localhost
spring.data.redis.port=6379
{{/if}}

{{#if options.includeSecurity}}
# Security
spring.security.user.name=admin
spring.security.user.password=admin
{{/if}}
```

### scaffold/src/test/java/com/example/{{project.name}}/ApplicationTests.java.hbs

```java
package com.example.{{project.name}};

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class ApplicationTests {

    @Test
    void contextLoads() {
        // Test that application context loads successfully
    }
}
```

### scaffold/README.md.hbs

```markdown
# {{project.name}}

Java Spring Boot backend project generated with nix-devshell-mcp.

## Stack

- **Framework**: Spring Boot {{options.springBootVersion}}
- **Language**: Java {{options.javaVersion}}
- **Build Tool**: {{#if_eq options.buildTool "maven"}}Maven{{else}}Gradle{{/if_eq}}
{{#if options.includeDatabase}}
- **Database**: {{#if_eq options.databaseType "postgresql"}}PostgreSQL{{else}}{{#if_eq options.databaseType "mysql"}}MySQL{{else}}H2{{/if_eq}}{{/if_eq}}
- **ORM**: Spring Data JPA
{{/if}}
{{#if options.includeRedis}}
- **Cache**: Redis (Spring Data Redis)
{{/if}}
{{#if options.includeSecurity}}
- **Security**: Spring Security
{{/if}}
- **Testing**: JUnit 5

## Getting Started

### Prerequisites

- Nix with flakes enabled
- direnv (recommended)

### Setup

1. **Activate the development environment**:
   ```bash
   direnv allow
   ```

2. **Run the application**:
   ```bash
   {{#if_eq options.buildTool "maven"}}./mvnw spring-boot:run{{else}}./gradlew bootRun{{/if_eq}}
   ```

The API will be available at `http://localhost:8080`.

## Available Commands

- `{{#if_eq options.buildTool "maven"}}./mvnw spring-boot:run{{else}}./gradlew bootRun{{/if_eq}}` - Run the application
- `{{#if_eq options.buildTool "maven"}}./mvnw test{{else}}./gradlew test{{/if_eq}}` - Run tests
- `{{#if_eq options.buildTool "maven"}}./mvnw clean package{{else}}./gradlew build{{/if_eq}}` - Build the application
- `{{#if_eq options.buildTool "maven"}}./mvnw clean{{else}}./gradlew clean{{/if_eq}}` - Clean build artifacts

## API Endpoints

- `GET /api/` - Welcome message
- `GET /api/health` - Health check

{{#if options.includeDatabase}}
## Database

{{#if_eq options.databaseType "postgresql"}}
PostgreSQL is included in the development environment. Configure in `application.properties`:

\`\`\`properties
spring.datasource.url=jdbc:postgresql://localhost:5432/{{project.name}}
spring.datasource.username=postgres
spring.datasource.password=postgres
\`\`\`
{{else}}
{{#if_eq options.databaseType "mysql"}}
MySQL is included in the development environment. Configure in `application.properties`:

\`\`\`properties
spring.datasource.url=jdbc:mysql://localhost:3306/{{project.name}}
spring.datasource.username=root
spring.datasource.password=root
\`\`\`
{{else}}
H2 in-memory database is configured. Access H2 console at:
`http://localhost:8080/h2-console`
{{/if_eq}}
{{/if_eq}}
{{/if}}

{{#if options.includeRedis}}
## Redis

Redis is included in the development environment. Configure in `application.properties`:

\`\`\`properties
spring.data.redis.host=localhost
spring.data.redis.port=6379
\`\`\`
{{/if}}

## Project Structure

\`\`\`
{{project.name}}/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/example/{{project.name}}/
│   │   │       ├── Application.java
│   │   │       └── controller/
│   │   │           └── HealthController.java
│   │   └── resources/
│   │       └── application.properties
│   └── test/
│       └── java/
│           └── com/example/{{project.name}}/
│               └── ApplicationTests.java
├── pom.xml
├── flake.nix
└── README.md
\`\`\`

## License

MIT

---

Generated with [nix-devshell-mcp](https://github.com/your-org/nix-devshell-mcp) on {{metadata.generatedAt}}
```

### scaffold/.gitignore

```
# Maven
target/
pom.xml.tag
pom.xml.releaseBackup
pom.xml.versionsBackup
pom.xml.next
release.properties
dependency-reduced-pom.xml
buildNumber.properties
.mvn/timing.properties
.mvn/wrapper/maven-wrapper.jar

# Gradle
.gradle/
build/
!gradle/wrapper/gradle-wrapper.jar
!**/src/main/**/build/
!**/src/test/**/build/

# IDE
.idea/
*.iws
*.iml
*.ipr
.vscode/
*.swp
*.swo
*~

# Eclipse
.apt_generated
.classpath
.factorypath
.project
.settings
.springBeans
.sts4-cache

# OS
.DS_Store
Thumbs.db

# Spring Boot
spring-boot-devtools.properties

# Logs
*.log

# Nix
result
result-*
.direnv/
```

### hooks/post-create.sh

```bash
#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$1"
cd "$PROJECT_DIR"

echo "Running post-create setup for {{project.name}}..."

# Initialize git repository if not already initialized
if [ ! -d ".git" ]; then
  echo "Initializing git repository..."
  git init
  echo "✓ Git repository initialized"
else
  echo "✓ Git repository already exists"
fi

# Note: Maven dependencies are managed by Maven itself
# The Nix environment provides Java and Maven, but Maven handles project dependencies
# Run './mvnw clean install' to download dependencies when needed

echo ""
echo "✓ Project setup complete!"
echo ""
echo "Next steps:"
echo "  1. cd {{project.name}}"
echo "  2. direnv allow"
echo "  3. {{#if_eq options.buildTool "maven"}}./mvnw spring-boot:run{{else}}./gradlew bootRun{{/if_eq}}"
```

---

## Handlebars Conventions

### Available Helpers

All templates have access to these Handlebars helpers:

#### `{{json value}}`
Serializes a value to JSON.

```handlebars
{{{json config}}}
```

#### `{{#if_eq a b}}`
Conditional block that executes if `a === b`.

```handlebars
{{#if_eq options.framework "express"}}
  express code
{{else}}
  fastify code
{{/if_eq}}
```

#### `{{#if_includes array value}}`
Conditional block that executes if array includes value.

```handlebars
{{#if_includes options.features "auth"}}
  include auth code
{{/if_includes}}
```

#### `{{lowercase str}}`
Converts string to lowercase.

```handlebars
{{lowercase project.name}}
```

#### `{{uppercase str}}`
Converts string to uppercase.

```handlebars
{{uppercase project.name}}
```

#### `{{year}}`
Returns current year.

```handlebars
Copyright {{year}}
```

### Context Variables

All templates receive this context:

```typescript
{
  project: {
    name: string;          // Project name
    path: string;          // Absolute project path
  },
  profile: {
    name: string;          // Profile name
    version: string;       // Profile version
  },
  options: {
    [key: string]: unknown; // User-provided options
  },
  config: {
    author?: string;
    email?: string;
    // ... merged configuration
  },
  metadata: {
    generatedAt: string;   // ISO 8601 timestamp
    generatedBy: string;   // "nix-devshell-mcp"
  }
}
```

### File Naming

- **Templates**: `{filename}.hbs` →  `{filename}` in output
- **Dynamic names**: Use `{{variable}}` in scaffold paths
- **Extensions**: Preserved from template name minus `.hbs`

Example:
```
src/styles.{{options.styling}}.hbs → src/styles.scss (if options.styling = "scss")
```

---

**Document Owner**: Template Team
**Review Cycle**: Before each profile update
**Next Review**: After MVP testing