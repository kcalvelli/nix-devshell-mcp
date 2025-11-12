import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { ErrorCode, McpError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import type { Profile, ProfileMetadata } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ProfileManager {
  private profiles: Map<string, Profile> = new Map();
  private templatesDir: string;

  constructor(templatesDir?: string) {
    // Default to templates directory relative to this file
    this.templatesDir = templatesDir || path.resolve(__dirname, '../../templates');
  }

  async loadProfiles(): Promise<void> {
    try {
      logger.info(`Loading profiles from: ${this.templatesDir}`);

      // Check if templates directory exists
      try {
        await fs.access(this.templatesDir);
      } catch {
        logger.warn(`Templates directory not found: ${this.templatesDir}`);
        this.profiles.clear();
        return;
      }

      // Read all directories in templates folder
      const entries = await fs.readdir(this.templatesDir, { withFileTypes: true });
      const profileDirs = entries.filter((entry) => entry.isDirectory());

      logger.debug(`Found ${profileDirs.length} potential profile directories`);

      // Load each profile
      let loadedCount = 0;
      for (const dir of profileDirs) {
        try {
          const profileName = dir.name;
          const profilePath = path.join(this.templatesDir, profileName);
          const profile = await this.loadProfile(profilePath, profileName);

          this.profiles.set(profileName, profile);
          loadedCount++;
          logger.debug(`Loaded profile: ${profileName}`);
        } catch (error) {
          const err = error as Error;
          logger.warn(`Failed to load profile from ${dir.name}: ${err.message}`);
        }
      }

      logger.info(`Successfully loaded ${loadedCount} profiles`);
    } catch (error) {
      const err = error as Error;
      throw new McpError(
        ErrorCode.INTERNAL_ERROR,
        `Failed to load profiles: ${err.message}`,
        { templatesDir: this.templatesDir },
      );
    }
  }

  private async loadProfile(profilePath: string, profileName: string): Promise<Profile> {
    const profileJsonPath = path.join(profilePath, 'profile.json');

    try {
      // Read profile.json
      const content = await fs.readFile(profileJsonPath, 'utf-8');
      const profileData = JSON.parse(content);

      // Validate profile structure
      this.validateProfileStructure(profileData, profileName);

      // Build complete profile object
      const profile: Profile = {
        metadata: profileData.metadata,
        templates: profileData.templates,
        defaults: profileData.defaults || {},
      };

      // Validate template file references
      await this.validateTemplateFiles(profilePath, profile.templates);

      return profile;
    } catch (error: unknown) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'ENOENT') {
        throw new McpError(
          ErrorCode.PROFILE_NOT_FOUND,
          `Profile configuration file not found: ${profileJsonPath}`,
          { profileName, path: profileJsonPath },
        );
      }
      if (error instanceof McpError) {
        throw error;
      }
      throw new McpError(
        ErrorCode.INVALID_CONFIG,
        `Failed to parse profile.json: ${err.message}`,
        { profileName, path: profileJsonPath },
      );
    }
  }

  private validateProfileStructure(profileData: unknown, profileName: string): void {
    if (typeof profileData !== 'object' || profileData === null) {
      throw new McpError(
        ErrorCode.INVALID_CONFIG,
        `Profile must be an object: ${profileName}`,
        { profileName },
      );
    }

    const profile = profileData as Record<string, unknown>;

    // Validate metadata
    if (!profile.metadata || typeof profile.metadata !== 'object') {
      throw new McpError(
        ErrorCode.INVALID_CONFIG,
        `Profile must have metadata object: ${profileName}`,
        { profileName },
      );
    }

    const metadata = profile.metadata as Record<string, unknown>;
    const requiredMetadataFields = ['name', 'description', 'version'];
    for (const field of requiredMetadataFields) {
      if (!metadata[field] || typeof metadata[field] !== 'string') {
        throw new McpError(
          ErrorCode.INVALID_CONFIG,
          `Profile metadata missing required field '${field}': ${profileName}`,
          { profileName, field },
        );
      }
    }

    // Validate templates
    if (!profile.templates || typeof profile.templates !== 'object') {
      throw new McpError(
        ErrorCode.INVALID_CONFIG,
        `Profile must have templates object: ${profileName}`,
        { profileName },
      );
    }

    const templates = profile.templates as Record<string, unknown>;
    if (!templates.flake || typeof templates.flake !== 'string') {
      throw new McpError(
        ErrorCode.INVALID_CONFIG,
        `Profile templates must include 'flake' template path: ${profileName}`,
        { profileName },
      );
    }

    // Validate defaults (optional, but must be object if present)
    if (profile.defaults !== undefined && typeof profile.defaults !== 'object') {
      throw new McpError(
        ErrorCode.INVALID_CONFIG,
        `Profile defaults must be an object: ${profileName}`,
        { profileName },
      );
    }
  }

  private async validateTemplateFiles(
    profilePath: string,
    templates: Record<string, unknown>,
  ): Promise<void> {
    const templateEntries = Object.entries(templates);

    for (const [key, value] of templateEntries) {
      if (typeof value === 'string') {
        const templatePath = path.join(profilePath, value);
        try {
          await fs.access(templatePath);
        } catch {
          throw new McpError(
            ErrorCode.TEMPLATE_ERROR,
            `Template file not found: ${value}`,
            { key, path: templatePath },
          );
        }
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Recursively validate nested template paths
        await this.validateTemplateFiles(profilePath, value as Record<string, unknown>);
      } else if (Array.isArray(value)) {
        // Validate array of template paths
        for (const item of value) {
          if (typeof item === 'string') {
            const templatePath = path.join(profilePath, item);
            try {
              await fs.access(templatePath);
            } catch {
              throw new McpError(
                ErrorCode.TEMPLATE_ERROR,
                `Template file not found: ${item}`,
                { key, path: templatePath },
              );
            }
          }
        }
      }
    }
  }

  getProfile(profileName: string): Profile {
    const profile = this.profiles.get(profileName);
    if (!profile) {
      throw new McpError(
        ErrorCode.PROFILE_NOT_FOUND,
        `Profile not found: ${profileName}`,
        {
          profileName,
          availableProfiles: Array.from(this.profiles.keys()),
        },
      );
    }
    return profile;
  }

  listProfiles(): ProfileMetadata[] {
    return Array.from(this.profiles.values()).map((profile) => profile.metadata);
  }

  hasProfile(profileName: string): boolean {
    return this.profiles.has(profileName);
  }

  getProfileCount(): number {
    return this.profiles.size;
  }

  getTemplatesDirectory(): string {
    return this.templatesDir;
  }
}
