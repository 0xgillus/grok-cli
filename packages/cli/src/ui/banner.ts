import chalk from 'chalk';
import { ConfigManager } from '@grok-cli/shared';

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

export async function displayContextInfo() {
  const configManager = ConfigManager.getInstance();
  await configManager.load();
  const config = configManager.getAll();
  
  const model = config.defaultModel || 'grok-beta';
  const hasApiKey = !!config.apiKey;
  
  if (hasApiKey) {
    const contextStatus = chalk.green('100% context left');
    const modelInfo = chalk.cyan(`${model} `);
    
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
