import * as fs from 'fs/promises';
import * as path from 'path';
import { ErrorCode, McpError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import type { WriteResult } from '../types.js';

export class FilesystemManager {
  async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
      logger.debug(`Directory ensured: ${dirPath}`);
    } catch (error: unknown) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'EACCES') {
        throw new McpError(
          ErrorCode.PERMISSION_DENIED,
          `Permission denied: Cannot create directory ${dirPath}`,
          { path: dirPath },
        );
      }
      throw new McpError(
        ErrorCode.FILESYSTEM_ERROR,
        `Failed to create directory: ${err.message}`,
        { path: dirPath, error: err.message },
      );
    }
  }

  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    try {
      // Ensure parent directory exists
      const dir = path.dirname(filePath);
      await this.ensureDirectory(dir);

      // Write file atomically
      const tmpPath = `${filePath}.tmp`;
      await fs.writeFile(tmpPath, content, 'utf-8');
      await fs.rename(tmpPath, filePath);

      logger.debug(`File written: ${filePath}`);
    } catch (error: unknown) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'EACCES') {
        throw new McpError(
          ErrorCode.PERMISSION_DENIED,
          `Permission denied: Cannot write file ${filePath}`,
          { path: filePath },
        );
      }
      throw new McpError(
        ErrorCode.FILESYSTEM_ERROR,
        `Failed to write file: ${err.message}`,
        { path: filePath, error: err.message },
      );
    }
  }

  async safeWrite(
    filePath: string,
    content: string,
    options: { skipIfExists: boolean },
  ): Promise<WriteResult> {
    try {
      // Check if file exists
      const exists = await this.fileExists(filePath);

      if (exists && options.skipIfExists) {
        logger.debug(`File exists, skipping: ${filePath}`);
        return { written: false, reason: 'exists' };
      }

      // Write the file
      await this.writeFile(filePath, content);
      return { written: true };
    } catch (error) {
      logger.error(`Error in safeWrite: ${error}`);
      return { written: false, reason: 'error' };
    }
  }

  async copyFile(src: string, dest: string): Promise<void> {
    try {
      const content = await fs.readFile(src, 'utf-8');
      await this.writeFile(dest, content);
      logger.debug(`File copied: ${src} -> ${dest}`);
    } catch (error: unknown) {
      const err = error as NodeJS.ErrnoException;
      throw new McpError(
        ErrorCode.FILESYSTEM_ERROR,
        `Failed to copy file: ${err.message}`,
        { src, dest, error: err.message },
      );
    }
  }

  async makeExecutable(filePath: string): Promise<void> {
    try {
      await fs.chmod(filePath, 0o755);
      logger.debug(`File made executable: ${filePath}`);
    } catch (error: unknown) {
      const err = error as NodeJS.ErrnoException;
      if (err.code === 'EACCES') {
        throw new McpError(
          ErrorCode.PERMISSION_DENIED,
          `Permission denied: Cannot make file executable ${filePath}`,
          { path: filePath },
        );
      }
      throw new McpError(
        ErrorCode.FILESYSTEM_ERROR,
        `Failed to make file executable: ${err.message}`,
        { path: filePath, error: err.message },
      );
    }
  }

  validatePath(projectPath: string, targetPath: string): void {
    const resolved = path.resolve(projectPath, targetPath);
    const normalized = path.normalize(resolved);
    const projectNorm = path.normalize(path.resolve(projectPath));

    // Check for path traversal
    if (normalized.includes('..')) {
      throw new McpError(
        ErrorCode.INVALID_PATH,
        'Path traversal detected: path must not contain ".."',
        { projectPath, targetPath },
      );
    }

    // Ensure path is within project directory
    if (!normalized.startsWith(projectNorm)) {
      throw new McpError(
        ErrorCode.INVALID_PATH,
        `File path escapes project directory: ${targetPath}`,
        { projectPath, targetPath, resolved: normalized },
      );
    }
  }
}
