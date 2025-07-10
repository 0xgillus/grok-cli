import inquirer from 'inquirer';
import chalk from 'chalk';
import { ConfigManager } from '@grok-cli/shared';
import { GrokAPIClient } from '@grok-cli/core';
import { displayFirstTimeSetup } from './banner';

export async function runFirstTimeSetup(): Promise<boolean> {
  displayFirstTimeSetup();
  
  const { setupChoice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'setupChoice',
      message: 'How would you like to proceed?',
      choices: [
        { name: 'Set up my xAI API key (recommended)', value: 'api_key' },
        { name: 'Skip setup for now', value: 'skip' }
      ],
      default: 'api_key',
    },
  ]);

  switch (setupChoice) {
    case 'api_key':
      return await promptForApiKey();
    case 'skip':
      console.log();
      console.log(chalk.yellow('WARNING: ') + 'You can set up your API key later with: ' + chalk.cyan('grok-cli config set-key'));
      console.log(chalk.gray('   Or set the environment variable: ') + chalk.cyan('export GROK_API_KEY="your-key"'));
      console.log();
      return false;
    default:
      return false;
  }
}

async function promptForApiKey(): Promise<boolean> {
  console.log();
  console.log(chalk.blue('API Key Setup'));
  console.log(chalk.gray('─'.repeat(30)));
  
  const { apiKey } = await inquirer.prompt([
    {
      type: 'password',
      name: 'apiKey',
      message: 'Enter your xAI API key:',
      mask: '●',
      validate: (input: string) => {
        if (!input || input.trim().length === 0) {
          return 'API key cannot be empty';
        }
        if (input.length < 10) {
          return 'API key seems too short. Please check and try again.';
        }
        return true;
      },
    },
  ]);

  // Test the API key
  console.log();
  console.log(chalk.blue('Testing API key...'));
  
  try {
    const client = new GrokAPIClient({ apiKey: apiKey.trim() });
    
    // Try to get models to validate the key
    await client.models();
    
    // If successful, save the key
    const configManager = ConfigManager.getInstance();
    await configManager.save({ apiKey: apiKey.trim() });
    
    console.log(chalk.green('API key validated and saved successfully!'));
    console.log();
    
    await showWelcomeMessage();
    
    return true;
  } catch (error: any) {
    console.log(chalk.red('API key validation failed'));
    
    if (error.statusCode === 401) {
      console.log(chalk.yellow('   Invalid API key. Please check your key and try again.'));
    } else if (error.code === 'NETWORK_ERROR') {
      console.log(chalk.yellow('   Network error. Please check your internet connection.'));
    } else {
      console.log(chalk.yellow(`   Error: ${error.message}`));
    }
    
    console.log();
    
    const { retry } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'retry',
        message: 'Would you like to try entering the API key again?',
        default: true,
      },
    ]);
    
    if (retry) {
      return await promptForApiKey();
    }
    
    return false;
  }
}

async function showWelcomeMessage() {
  console.log(chalk.green('You\'re all set!'));
  console.log();
}
