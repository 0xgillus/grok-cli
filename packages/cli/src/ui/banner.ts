import chalk from 'chalk';
import { ConfigManager } from '@grok-cli/shared';
import { GrokAPIClient } from '@grok-cli/core';

export function displayWelcomeBanner() {
  console.clear();
  
  // Beautiful ASCII art for GROK CLI with gray colors and ASCII "x"
  const banner = `
${chalk.gray(' ██╗  ██╗ ')}${chalk.gray('  ██████╗ ')}${chalk.gray(' ██████╗ ')}${chalk.gray(' ██████╗ ')}${chalk.gray(' ██╗  ██╗')}${chalk.dim.gray('     ██████╗')}${chalk.dim.gray(' ██╗     ')}${chalk.dim.gray(' ██╗')}
${chalk.gray(' ╚██╗██╔╝ ')}${chalk.gray(' ██╔════╝ ')}${chalk.gray(' ██╔══██╗')}${chalk.gray(' ██╔═══██╗')}${chalk.gray(' ██║ ██╔╝')}${chalk.dim.gray('    ██╔════╝')}${chalk.dim.gray(' ██║     ')}${chalk.dim.gray(' ██║')}
${chalk.gray('  ╚███╔╝  ')}${chalk.gray(' ██║  ███╗')}${chalk.gray(' ██████╔╝')}${chalk.gray(' ██║   ██║')}${chalk.gray(' █████╔╝ ')}${chalk.dim.gray('    ██║     ')}${chalk.dim.gray(' ██║     ')}${chalk.dim.gray(' ██║')}
${chalk.gray('  ██╔██╗  ')}${chalk.gray(' ██║   ██║')}${chalk.gray(' ██╔══██╗')}${chalk.gray(' ██║   ██║')}${chalk.gray(' ██╔═██╗ ')}${chalk.dim.gray('    ██║     ')}${chalk.dim.gray(' ██║     ')}${chalk.dim.gray(' ██║')}
${chalk.gray(' ██╔╝ ██╗ ')}${chalk.gray(' ╚██████╔╝')}${chalk.gray(' ██║  ██║')}${chalk.gray(' ╚██████╔╝')}${chalk.gray(' ██║  ██╗')}${chalk.dim.gray('    ╚██████╗')}${chalk.dim.gray(' ███████╗')}${chalk.dim.gray(' ██║')}
${chalk.gray(' ╚═╝  ╚═╝ ')}${chalk.gray('  ╚═════╝ ')}${chalk.gray(' ╚═╝  ╚═╝')}${chalk.gray('  ╚═════╝ ')}${chalk.gray(' ╚═╝  ╚═╝')}${chalk.dim.gray('     ╚═════╝')}${chalk.dim.gray(' ╚══════╝')}${chalk.dim.gray(' ╚═╝')}
`;

  console.log(banner);
  console.log();
  console.log(chalk.gray('                      ') + chalk.bold.hex('#FF6B6B')('Command-line interface for xAI\'s Grok models'));
  console.log();
  console.log(chalk.hex('#4ECDC4')('Tips for getting started:'));
  console.log(chalk.gray('1. ') + chalk.white('Ask questions, edit files, or run commands.'));
  console.log(chalk.gray('2. ') + chalk.white('Be specific for the best results.'));
  console.log(chalk.gray('3. ') + chalk.white('Create ') + chalk.cyan('GROK.md') + chalk.white(' files to customize your interactions with Grok.'));
  console.log(chalk.gray('4. ') + chalk.cyan('/help') + chalk.white(' for more information.'));
  console.log();
}

export function displayFirstTimeSetup() {
  console.log(chalk.yellow('WARNING: ') + chalk.bold('First time setup required'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log(chalk.white('To get started with Grok CLI, you need to configure your xAI API key.'));
  console.log();
  console.log(chalk.cyan('How to get your API key:'));
  console.log(chalk.gray('   1. Visit ') + chalk.underline.blue('https://console.x.ai/'));
  console.log(chalk.gray('   2. Sign in to your xAI account'));
  console.log(chalk.gray('   3. Navigate to API Keys section'));
  console.log(chalk.gray('   4. Create a new API key'));
  console.log();
}

export async function displayContextInfo(modelName?: string, contextLength?: number, usedTokens?: number) {
  const configManager = ConfigManager.getInstance();
  await configManager.load();
  const config = configManager.getAll();
  
  const hasApiKey = !!config.apiKey;
  
  if (!hasApiKey || !config.apiKey) {
    return;
  }

  try {
    let actualModel = modelName;
    let actualContextLength = contextLength;
    
    // Always fetch current model info from API to ensure accuracy
    if (!actualModel || !actualContextLength) {
      const client = new GrokAPIClient({ apiKey: config.apiKey });
      const models = await client.models();
      
      if (models.length > 0) {
        // Use the first available model if no model specified
        let currentModel = models[0].id;
        
        // Prioritize models: grok-4 > grok-3 > grok-2 > others
        const modelPriority = ['grok-4-0709', 'grok-3', 'grok-3-fast', 'grok-2-1212', 'grok-2-vision-1212'];
        for (const priorityModel of modelPriority) {
          const foundModel = models.find((m: any) => m.id === priorityModel);
          if (foundModel) {
            currentModel = foundModel.id;
            break;
          }
        }
        
        // If a model is configured and available, use that instead
        if (config.defaultModel) {
          const configuredModel = models.find((m: any) => m.id === config.defaultModel);
          if (configuredModel) {
            currentModel = configuredModel.id;
          }
        }
        
        const selectedModel = models.find((m: any) => m.id === currentModel) || models[0];
        
        actualModel = currentModel;
        actualContextLength = selectedModel?.contextLength || 32768;
      } else {
        actualModel = 'unknown';
        actualContextLength = 32768;
      }
    }
    
    // Calculate context status
    const availableTokens = actualContextLength! - (usedTokens || 0);
    const percentageLeft = Math.max(0, (availableTokens / actualContextLength!) * 100);
    
    let contextStatus;
    let percentDisplay;
    
    if (usedTokens && usedTokens > 0) {
      // More accurate percentage display
      if (percentageLeft >= 99.95) {
        percentDisplay = '100%';
      } else if (percentageLeft >= 99.5) {
        percentDisplay = Math.round(percentageLeft * 10) / 10 + '%'; // Show one decimal
      } else {
        percentDisplay = Math.round(percentageLeft) + '%';
      }
      
      if (percentageLeft > 75) {
        contextStatus = chalk.green(`${availableTokens.toLocaleString()} tokens available (${percentDisplay})`);
      } else if (percentageLeft > 25) {
        contextStatus = chalk.yellow(`${availableTokens.toLocaleString()} tokens available (${percentDisplay})`);
      } else {
        contextStatus = chalk.red(`${availableTokens.toLocaleString()} tokens available (${percentDisplay})`);
      }
    } else {
      contextStatus = chalk.green(`${actualContextLength!.toLocaleString()} tokens available`);
    }
    
    const modelInfo = chalk.cyan(`${actualModel}`);
    
    console.log();
    console.log(chalk.gray('─'.repeat(70)));
    console.log(
      chalk.gray('Model: ') + modelInfo + 
      chalk.gray(' | Context: ') + contextStatus +
      chalk.gray(' | Type ') + chalk.cyan('/help') + chalk.gray(' for commands')
    );
    console.log(chalk.gray('─'.repeat(70)));
    console.log();
    
  } catch (error: any) {
    // Fallback to showing basic info if API call fails
    const model = modelName || 'unknown';
    const modelInfo = chalk.cyan(`${model}`);
    const contextStatus = chalk.yellow('API unavailable');
    
    console.log();
    console.log(chalk.gray('─'.repeat(70)));
    console.log(
      chalk.gray('Model: ') + modelInfo + 
      chalk.gray(' | Context: ') + contextStatus +
      chalk.gray(' | Type ') + chalk.cyan('/help') + chalk.gray(' for commands')
    );
    console.log(chalk.gray('─'.repeat(70)));
    console.log();
  }
}

export function displayPrompt() {
  return chalk.cyan('❯ ') + chalk.gray('Type your message or @path/to/file');
}
