import { Command } from 'commander';
import { ConfigManager, logger } from '@grok-cli/shared';
import inquirer from 'inquirer';

export const configCommand = new Command('config')
  .description('Manage configuration settings');

configCommand
  .command('set-key')
  .description('Set the xAI API key')
  .argument('[key]', 'API key (if not provided, will prompt securely)')
  .action(async (key?: string) => {
    const configManager = ConfigManager.getInstance();
    
    let apiKey = key;
    if (!apiKey) {
      const { inputKey } = await inquirer.prompt([
        {
          type: 'password',
          name: 'inputKey',
          message: 'Enter your xAI API key:',
          mask: '*',
          validate: (input: string) => input.trim().length > 0 || 'API key cannot be empty',
        },
      ]);
      apiKey = inputKey;
    }

    try {
      await configManager.save({ apiKey });
      logger.success('API key saved successfully!');
    } catch (error) {
      logger.error(`Failed to save API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

configCommand
  .command('set-model')
  .description('Set the default model')
  .argument('<model>', 'Model name (e.g., grok-beta, grok-2)')
  .action(async (model: string) => {
    const configManager = ConfigManager.getInstance();
    
    try {
      await configManager.save({ defaultModel: model });
      logger.success(`Default model set to: ${model}`);
    } catch (error) {
      logger.error(`Failed to set model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

configCommand
  .command('set-url')
  .description('Set the base URL for the API')
  .argument('<url>', 'Base URL (e.g., https://api.x.ai/v1)')
  .action(async (url: string) => {
    const configManager = ConfigManager.getInstance();
    
    try {
      await configManager.save({ baseUrl: url });
      logger.success(`Base URL set to: ${url}`);
    } catch (error) {
      logger.error(`Failed to set URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

configCommand
  .command('show')
  .description('Show current configuration')
  .action(async () => {
    const configManager = ConfigManager.getInstance();
    const config = configManager.getAll();
    
    console.log('\nCurrent configuration:');
    console.log('─'.repeat(40));
    console.log(`API Key: ${config.apiKey ? '***' + config.apiKey.slice(-4) : 'Not set'}`);
    console.log(`Base URL: ${config.baseUrl || 'Default (https://api.x.ai/v1)'}`);
    console.log(`Default Model: ${config.defaultModel || 'grok-beta'}`);
    console.log(`Temperature: ${config.temperature || 'Default'}`);
    console.log(`Max Tokens: ${config.maxTokens || 'Default'}`);
    console.log('─'.repeat(40));
  });

configCommand
  .command('reset')
  .description('Reset configuration to defaults')
  .action(async () => {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Are you sure you want to reset all configuration?',
        default: false,
      },
    ]);

    if (!confirm) {
      logger.info('Reset cancelled.');
      return;
    }

    const configManager = ConfigManager.getInstance();
    
    try {
      await configManager.reset();
      logger.success('Configuration reset successfully!');
    } catch (error) {
      logger.error(`Failed to reset configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

configCommand
  .command('remove-key')
  .description('Remove the stored API key')
  .action(async () => {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Are you sure you want to remove your API key?',
        default: false,
      },
    ]);

    if (!confirm) {
      logger.info('Key removal cancelled.');
      return;
    }

    const configManager = ConfigManager.getInstance();
    
    try {
      const config = configManager.getAll();
      // Remove API key from config and save the rest
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { apiKey, ...configWithoutKey } = config;
      await configManager.reset();
      await configManager.save(configWithoutKey);
      logger.success('API key removed successfully!');
    } catch (error) {
      logger.error(`Failed to remove API key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
