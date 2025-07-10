import * as fs from 'fs/promises';
import * as path from 'path';
import { isCodeFile, readFileSafely } from '@grok-cli/shared';

export interface FileInfo {
  path: string;
  content: string;
  size: number;
  isCode: boolean;
}

export class FileProcessor {
  private maxFileSize: number;
  private excludePatterns: RegExp[];

  constructor(maxFileSize: number = 1024 * 1024) { // 1MB default
    this.maxFileSize = maxFileSize;
    this.excludePatterns = [
      /node_modules/,
      /\.git/,
      /dist/,
      /build/,
      /coverage/,
      /\.DS_Store/,
      /\.env/,
    ];
  }

  async processFile(filePath: string): Promise<FileInfo | null> {
    try {
      const content = await readFileSafely(filePath);
      if (!content) {
        return null;
      }

      const stats = await fs.stat(filePath);
      if (stats.size > this.maxFileSize) {
        return null;
      }

      return {
        path: filePath,
        content,
        size: stats.size,
        isCode: isCodeFile(filePath)
      };
    } catch (error) {
      return null;
    }
  }

  async processDirectory(dirPath: string, recursive: boolean = true): Promise<FileInfo[]> {
    const results: FileInfo[] = [];
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (this.shouldExclude(fullPath)) {
          continue;
        }

        if (entry.isDirectory() && recursive) {
          const subResults = await this.processDirectory(fullPath, recursive);
          results.push(...subResults);
        } else if (entry.isFile()) {
          const fileInfo = await this.processFile(fullPath);
          if (fileInfo) {
            results.push(fileInfo);
          }
        }
      }
    } catch (error) {
      // Directory might not exist or be accessible
    }

    return results;
  }

  async findGitRepository(startPath: string): Promise<string | null> {
    let currentPath = path.resolve(startPath);
    
    while (currentPath !== path.dirname(currentPath)) {
      const gitPath = path.join(currentPath, '.git');
      try {
        await fs.access(gitPath);
        return currentPath;
      } catch {
        currentPath = path.dirname(currentPath);
      }
    }
    
    return null;
  }

  async getRelevantFiles(
    targetPath: string,
    extensions?: string[]
  ): Promise<FileInfo[]> {
    const stats = await fs.stat(targetPath);
    
    if (stats.isFile()) {
      const fileInfo = await this.processFile(targetPath);
      return fileInfo ? [fileInfo] : [];
    }

    const files = await this.processDirectory(targetPath);
    
    if (extensions && extensions.length > 0) {
      return files.filter(file => 
        extensions.some(ext => file.path.endsWith(ext))
      );
    }

    // Prioritize code files
    return files.filter(file => file.isCode);
  }

  private shouldExclude(filePath: string): boolean {
    return this.excludePatterns.some(pattern => pattern.test(filePath));
  }

  addExcludePattern(pattern: RegExp): void {
    this.excludePatterns.push(pattern);
  }

  removeExcludePattern(pattern: RegExp): void {
    this.excludePatterns = this.excludePatterns.filter(p => p.source !== pattern.source);
  }
}
