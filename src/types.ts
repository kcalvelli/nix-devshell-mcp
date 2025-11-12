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
  schema?: Record<string, unknown>;
  postCreate?: string;
}

export interface ProfileOption {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  description: string;
  required: boolean;
  default?: unknown;
  enum?: string[];
}

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
  [key: string]: unknown;
}

export interface ScaffoldFile {
  source: string;
  destination: string;
  executable: boolean;
}

export interface StaticFile {
  source: string;
  destination: string;
}

export interface HookFile {
  source: string;
  executable: boolean;
}

export interface UserConfig {
  author?: string;
  email?: string;
  organization?: string;
  defaults?: {
    nodeVersion?: string;
    pythonVersion?: string;
    javaVersion?: string;
    packageManager?: string;
    [key: string]: unknown;
  };
  registries?: {
    npm?: string;
    pypi?: string;
    maven?: string;
  };
  profileDefaults?: {
    [profileName: string]: Record<string, unknown>;
  };
  [key: string]: unknown;
}

export type ProjectConfig = UserConfig;

export interface MergedConfig extends Record<string, unknown> {
  author?: string;
  email?: string;
  organization?: string;
  nodeVersion?: string;
  pythonVersion?: string;
  javaVersion?: string;
  npmRegistry?: string;
  pypiIndex?: string;
  mavenRepository?: string;
}

export interface CreateDevshellInput {
  projectPath: string;
  profile: string;
  options?: Record<string, unknown>;
}

export interface CreateDevshellOutput {
  success: boolean;
  filesCreated: string[];
  profile: string;
  configuration: MergedConfig;
  hookResult?: ExecutionResult;
}

export interface ListProfilesOutput {
  profiles: ProfileMetadata[];
}

export interface RenderContext extends Record<string, unknown> {
  profile: string;
  projectPath: string;
  projectName: string;
}

export interface ExecutionResult {
  success: boolean;
  exitCode: number;
  stdout?: string;
  stderr?: string;
  duration?: number;
  error?: string;
}

export interface WriteResult {
  written: boolean;
  reason?: 'exists' | 'error';
}
