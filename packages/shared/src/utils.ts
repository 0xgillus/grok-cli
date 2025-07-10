import * as path from 'path';
import * as fs from 'fs-extra';

export function isValidApiKey(apiKey: string): boolean {
  return typeof apiKey === 'string' && apiKey.length > 0;
}

export function formatTokenCount(tokens: number): string {
  if (tokens < 1000) {
    return `${tokens} tokens`;
  }
  return `${(tokens / 1000).toFixed(1)}k tokens`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
}

export async function readFileSafely(filePath: string): Promise<string | null> {
  try {
    const fullPath = path.resolve(filePath);
    if (await fs.pathExists(fullPath)) {
      return await fs.readFile(fullPath, 'utf-8');
    }
    return null;
  } catch (error) {
    return null;
  }
}

export async function writeFileSafely(
  filePath: string,
  content: string
): Promise<boolean> {
  try {
    const fullPath = path.resolve(filePath);
    await fs.ensureDir(path.dirname(fullPath));
    await fs.writeFile(fullPath, content, 'utf-8');
    return true;
  } catch (error) {
    return false;
  }
}

export function getFileExtension(filePath: string): string {
  return path.extname(filePath).toLowerCase();
}

export function isCodeFile(filePath: string): boolean {
  const codeExtensions = [
    '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.h',
    '.cs', '.php', '.rb', '.go', '.rs', '.kt', '.swift', '.scala',
    '.r', '.m', '.sh', '.ps1', '.html', '.css', '.scss', '.less',
    '.sql', '.json', '.xml', '.yaml', '.yml', '.toml', '.ini'
  ];
  return codeExtensions.includes(getFileExtension(filePath));
}

export function humanFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
