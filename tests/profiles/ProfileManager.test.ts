import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { ProfileManager } from '../../src/profiles/ProfileManager.js';
import { McpError, ErrorCode } from '../../src/utils/errors.js';

describe('ProfileManager', () => {
  let profileManager: ProfileManager;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'profile-test-'));
    profileManager = new ProfileManager(tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  async function createTestProfile(
    name: string,
    profile: any = {},
    templates: Record<string, string> = {}
  ) {
    const profileDir = path.join(tempDir, name);
    await fs.mkdir(profileDir, { recursive: true });

    const defaultProfile = {
      metadata: {
        name,
        displayName: `Test ${name}`,
        description: 'Test profile',
        version: '1.0.0',
        supportedOptions: [],
        tags: ['test'],
        examples: [],
      },
      templates: {
        flake: 'flake.nix.hbs',
        ...templates,
      },
      defaults: {},
      ...profile,
    };

    await fs.writeFile(
      path.join(profileDir, 'profile.json'),
      JSON.stringify(defaultProfile)
    );

    // Create template files
    for (const [key, value] of Object.entries(defaultProfile.templates)) {
      if (typeof value === 'string') {
        await fs.writeFile(path.join(profileDir, value), `# ${key} template`);
      }
    }

    return defaultProfile;
  }

  describe('loadProfiles', () => {
    it('should load no profiles from empty directory', async () => {
      await profileManager.loadProfiles();
      expect(profileManager.getProfileCount()).toBe(0);
    });

    it('should load single valid profile', async () => {
      await createTestProfile('test-profile');

      await profileManager.loadProfiles();

      expect(profileManager.getProfileCount()).toBe(1);
      expect(profileManager.hasProfile('test-profile')).toBe(true);
    });

    it('should load multiple profiles', async () => {
      await createTestProfile('profile1');
      await createTestProfile('profile2');
      await createTestProfile('profile3');

      await profileManager.loadProfiles();

      expect(profileManager.getProfileCount()).toBe(3);
      expect(profileManager.hasProfile('profile1')).toBe(true);
      expect(profileManager.hasProfile('profile2')).toBe(true);
      expect(profileManager.hasProfile('profile3')).toBe(true);
    });

    it('should skip invalid profiles and continue loading', async () => {
      await createTestProfile('valid-profile');

      // Create invalid profile (missing metadata)
      const invalidDir = path.join(tempDir, 'invalid-profile');
      await fs.mkdir(invalidDir);
      await fs.writeFile(
        path.join(invalidDir, 'profile.json'),
        JSON.stringify({ invalid: true })
      );

      await profileManager.loadProfiles();

      expect(profileManager.getProfileCount()).toBe(1);
      expect(profileManager.hasProfile('valid-profile')).toBe(true);
      expect(profileManager.hasProfile('invalid-profile')).toBe(false);
    });
  });

  describe('getProfile', () => {
    it('should return profile by name', async () => {
      const testProfile = await createTestProfile('my-profile');
      await profileManager.loadProfiles();

      const profile = profileManager.getProfile('my-profile');

      expect(profile.metadata.name).toBe('my-profile');
    });

    it('should throw McpError for non-existent profile', async () => {
      await profileManager.loadProfiles();

      expect(() => profileManager.getProfile('nonexistent')).toThrow(McpError);
    });

    it('should include available profiles in error', async () => {
      await createTestProfile('profile1');
      await createTestProfile('profile2');
      await profileManager.loadProfiles();

      try {
        profileManager.getProfile('nonexistent');
        expect.fail('Should have thrown');
      } catch (error) {
        const mcpError = error as McpError;
        expect(mcpError.details).toHaveProperty('availableProfiles');
        expect(mcpError.details.availableProfiles).toContain('profile1');
        expect(mcpError.details.availableProfiles).toContain('profile2');
      }
    });
  });

  describe('listProfiles', () => {
    it('should return empty array when no profiles loaded', async () => {
      await profileManager.loadProfiles();

      const profiles = profileManager.listProfiles();
      expect(profiles).toEqual([]);
    });

    it('should return metadata for all profiles', async () => {
      await createTestProfile('profile1');
      await createTestProfile('profile2');
      await profileManager.loadProfiles();

      const profiles = profileManager.listProfiles();

      expect(profiles).toHaveLength(2);
      expect(profiles[0]).toHaveProperty('name');
      expect(profiles[0]).toHaveProperty('description');
      expect(profiles[0]).toHaveProperty('version');
    });
  });

  describe('hasProfile', () => {
    it('should return true for existing profile', async () => {
      await createTestProfile('existing');
      await profileManager.loadProfiles();

      expect(profileManager.hasProfile('existing')).toBe(true);
    });

    it('should return false for non-existing profile', async () => {
      await profileManager.loadProfiles();

      expect(profileManager.hasProfile('nonexistent')).toBe(false);
    });
  });

  describe('profile validation', () => {
    it('should reject profile without metadata', async () => {
      const profileDir = path.join(tempDir, 'invalid');
      await fs.mkdir(profileDir);
      await fs.writeFile(
        path.join(profileDir, 'profile.json'),
        JSON.stringify({
          templates: { flake: 'flake.nix.hbs' },
          defaults: {},
        })
      );

      await profileManager.loadProfiles();

      expect(profileManager.hasProfile('invalid')).toBe(false);
    });

    it('should reject profile without required metadata fields', async () => {
      const profileDir = path.join(tempDir, 'incomplete');
      await fs.mkdir(profileDir);
      await fs.writeFile(
        path.join(profileDir, 'profile.json'),
        JSON.stringify({
          metadata: {
            name: 'incomplete',
            // missing description and version
          },
          templates: { flake: 'flake.nix.hbs' },
          defaults: {},
        })
      );

      await profileManager.loadProfiles();

      expect(profileManager.hasProfile('incomplete')).toBe(false);
    });

    it('should reject profile without templates', async () => {
      const profileDir = path.join(tempDir, 'no-templates');
      await fs.mkdir(profileDir);
      await fs.writeFile(
        path.join(profileDir, 'profile.json'),
        JSON.stringify({
          metadata: {
            name: 'no-templates',
            description: 'Test',
            version: '1.0.0',
            supportedOptions: [],
            tags: [],
            examples: [],
          },
          defaults: {},
        })
      );

      await profileManager.loadProfiles();

      expect(profileManager.hasProfile('no-templates')).toBe(false);
    });

    it('should reject profile without flake template', async () => {
      const profileDir = path.join(tempDir, 'no-flake');
      await fs.mkdir(profileDir);
      await fs.writeFile(
        path.join(profileDir, 'profile.json'),
        JSON.stringify({
          metadata: {
            name: 'no-flake',
            description: 'Test',
            version: '1.0.0',
            supportedOptions: [],
            tags: [],
            examples: [],
          },
          templates: {
            other: 'other.txt',
          },
          defaults: {},
        })
      );

      await profileManager.loadProfiles();

      expect(profileManager.hasProfile('no-flake')).toBe(false);
    });

    it('should reject profile when template files do not exist', async () => {
      const profileDir = path.join(tempDir, 'missing-files');
      await fs.mkdir(profileDir);
      await fs.writeFile(
        path.join(profileDir, 'profile.json'),
        JSON.stringify({
          metadata: {
            name: 'missing-files',
            description: 'Test',
            version: '1.0.0',
            supportedOptions: [],
            tags: [],
            examples: [],
          },
          templates: {
            flake: 'flake.nix.hbs', // file does not exist
          },
          defaults: {},
        })
      );

      await profileManager.loadProfiles();

      expect(profileManager.hasProfile('missing-files')).toBe(false);
    });
  });

  describe('getTemplatesDirectory', () => {
    it('should return templates directory path', () => {
      const templatesDir = profileManager.getTemplatesDirectory();
      expect(templatesDir).toBe(tempDir);
    });
  });
});
