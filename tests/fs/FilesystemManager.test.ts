import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { FilesystemManager } from '../../src/fs/FilesystemManager.js';
import { McpError, ErrorCode } from '../../src/utils/errors.js';

describe('FilesystemManager', () => {
  let fsManager: FilesystemManager;
  let tempDir: string;

  beforeEach(async () => {
    fsManager = new FilesystemManager();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'fs-test-'));
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

    it('should create nested directories', async () => {
      const dirPath = path.join(tempDir, 'nested', 'dir', 'structure');
      await fsManager.ensureDirectory(dirPath);

      const stats = await fs.stat(dirPath);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should not throw if directory already exists', async () => {
      const dirPath = path.join(tempDir, 'existing-dir');
      await fs.mkdir(dirPath);

      await expect(fsManager.ensureDirectory(dirPath)).resolves.not.toThrow();
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
      const filePath = path.join(tempDir, 'test.txt');
      const content = 'Hello, World!';

      await fsManager.writeFile(filePath, content);

      const fileContent = await fs.readFile(filePath, 'utf-8');
      expect(fileContent).toBe(content);
    });

    it('should create parent directory if it does not exist', async () => {
      const filePath = path.join(tempDir, 'nested', 'test.txt');
      const content = 'content';

      await fsManager.writeFile(filePath, content);

      const fileContent = await fs.readFile(filePath, 'utf-8');
      expect(fileContent).toBe(content);
    });

    it('should write atomically using temp file', async () => {
      const filePath = path.join(tempDir, 'atomic.txt');
      const content = 'atomic content';

      await fsManager.writeFile(filePath, content);

      // Check no .tmp file remains
      const files = await fs.readdir(tempDir);
      const tmpFiles = files.filter((f) => f.endsWith('.tmp'));
      expect(tmpFiles).toHaveLength(0);
    });
  });

  describe('safeWrite', () => {
    it('should write file when it does not exist', async () => {
      const filePath = path.join(tempDir, 'new-file.txt');
      const content = 'new content';

      const result = await fsManager.safeWrite(filePath, content, { skipIfExists: true });

      expect(result.written).toBe(true);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      expect(fileContent).toBe(content);
    });

    it('should skip writing if file exists and skipIfExists is true', async () => {
      const filePath = path.join(tempDir, 'existing.txt');
      const originalContent = 'original';
      const newContent = 'new';

      await fs.writeFile(filePath, originalContent);

      const result = await fsManager.safeWrite(filePath, newContent, { skipIfExists: true });

      expect(result.written).toBe(false);
      expect(result.reason).toBe('exists');

      const fileContent = await fs.readFile(filePath, 'utf-8');
      expect(fileContent).toBe(originalContent);
    });

    it('should overwrite if file exists and skipIfExists is false', async () => {
      const filePath = path.join(tempDir, 'overwrite.txt');
      const originalContent = 'original';
      const newContent = 'new';

      await fs.writeFile(filePath, originalContent);

      const result = await fsManager.safeWrite(filePath, newContent, { skipIfExists: false });

      expect(result.written).toBe(true);

      const fileContent = await fs.readFile(filePath, 'utf-8');
      expect(fileContent).toBe(newContent);
    });
  });

  describe('copyFile', () => {
    it('should copy file to destination', async () => {
      const srcPath = path.join(tempDir, 'source.txt');
      const destPath = path.join(tempDir, 'dest.txt');
      const content = 'file content';

      await fs.writeFile(srcPath, content);
      await fsManager.copyFile(srcPath, destPath);

      const destContent = await fs.readFile(destPath, 'utf-8');
      expect(destContent).toBe(content);
    });
  });

  describe('makeExecutable', () => {
    it('should make file executable', async () => {
      const filePath = path.join(tempDir, 'script.sh');
      await fs.writeFile(filePath, '#!/bin/bash\necho "test"');

      await fsManager.makeExecutable(filePath);

      const stats = await fs.stat(filePath);
      // Check that owner has execute permission (0o100)
      expect(stats.mode & 0o100).toBeGreaterThan(0);
    });
  });

  describe('validatePath', () => {
    it('should accept valid path within project', () => {
      expect(() =>
        fsManager.validatePath(tempDir, 'subdir/file.txt')
      ).not.toThrow();
    });

    it('should reject path with traversal (..) in the string', () => {
      expect(() =>
        fsManager.validatePath(tempDir, '../outside/file.txt')
      ).toThrow(McpError);
    });

    it('should reject path escaping project directory', () => {
      expect(() =>
        fsManager.validatePath(tempDir, '/etc/passwd')
      ).toThrow(McpError);
    });

    it('should accept absolute path within project', () => {
      const validPath = path.join(tempDir, 'file.txt');
      expect(() =>
        fsManager.validatePath(tempDir, validPath)
      ).not.toThrow();
    });
  });
});
