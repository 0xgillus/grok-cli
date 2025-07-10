import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { Config } from './types';

const CONFIG_DIR = path.join(os.homedir(), '.grok-cli');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export class ConfigManager {
  private static instance: ConfigManager;
  private config: Config = {};

  private constructor() {}

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  async load(): Promise<Config> {
    try {
      if (await fs.pathExists(CONFIG_FILE)) {
        this.config = await fs.readJson(CONFIG_FILE);
      }
      
      // Override with environment variables
      if (process.env.GROK_API_KEY) {
        this.config.apiKey = process.env.GROK_API_KEY;
      }
      if (process.env.GROK_BASE_URL) {
        this.config.baseUrl = process.env.GROK_BASE_URL;
      }
      
      return this.config;
    } catch (error) {
      throw new Error(`Failed to load config: ${error}`);
    }
  }

  async save(newConfig: Partial<Config>): Promise<void> {
    try {
      this.config = { ...this.config, ...newConfig };
      await fs.ensureDir(CONFIG_DIR);
      await fs.writeJson(CONFIG_FILE, this.config, { spaces: 2 });
    } catch (error) {
      throw new Error(`Failed to save config: ${error}`);
    }
  }

  get(key: keyof Config): any {
    return this.config[key];
  }

  getAll(): Config {
    return { ...this.config };
  }

  async reset(): Promise<void> {
    try {
      this.config = {};
      if (await fs.pathExists(CONFIG_FILE)) {
        await fs.remove(CONFIG_FILE);
      }
    } catch (error) {
      throw new Error(`Failed to reset config: ${error}`);
    }
  }
}
