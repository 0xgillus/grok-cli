import inquirer from 'inquirer';
import chalk from 'chalk';
import { GrokAPIClient } from '@grok-cli/core';
import { ConfigManager, logger, Message } from '@grok-cli/shared';
import { displayWelcomeBanner, displayContextInfo, displayPrompt } from './banner';
import { runFirstTimeSetup } from './onboarding';
import ora from 'ora';

export class InteractiveChat {
  private client?: GrokAPIClient;
  private messages: Message[] = [];
  private configManager: ConfigManager;
  private config: any;

  constructor() {
    this.configManager = ConfigManager.getInstance();
  }

  async start(): Promise<void> {
    await this.configManager.load();
    this.config = this.configManager.getAll();

    // Show banner
    displayWelcomeBanner();

    // Check if API key is configured
    if (!this.config.apiKey) {
      const setupComplete = await runFirstTimeSetup();
      if (!setupComplete) {
        console.log(chalk.yellow('Setup skipped. You can configure your API key later.'));
        return;
      }
      
      // Reload config after setup
      await this.configManager.load();
      this.config = this.configManager.getAll();
    }

    // Initialize the client
    this.client = new GrokAPIClient({ 
      apiKey: this.config.apiKey
    });

    // Start the chat loop
    await this.chatLoop();
  }

  private async chatLoop(): Promise<void> {
    // Display context info
    await displayContextInfo();

    console.log(chalk.green('✨ Ready to chat! Type ') + chalk.cyan('/help') + chalk.green(' for commands or ') + chalk.cyan('/quit') + chalk.green(' to exit.'));
    console.log();

    while (true) {
      try {
        const input = await this.getUserInput();
        
        if (input.startsWith('/')) {
          const shouldContinue = await this.handleCommand(input);
          if (!shouldContinue) break;
          continue;
        }

        if (input.trim() === '') {
          continue;
        }

        await this.processUserMessage(input);
      } catch (error: any) {
        if (error.isTtyError || error.signal === 'SIGINT') {
          console.log();
          console.log(chalk.yellow('👋 Thanks for using Grok CLI! Goodbye!'));
          break;
        }
        logger.error(`Error in chat loop: ${error.message || error}`);
        console.log(chalk.red('An error occurred. Please try again.'));
      }
    }
  }

  private async getUserInput(): Promise<string> {
    const { input } = await inquirer.prompt([
      {
        type: 'input',
        name: 'input',
        message: chalk.cyan('❯'),
        prefix: '',
        validate: (input: string) => {
          return true; // Allow empty input for now
        }
      }
    ]);
    return input;
  }

  private async handleCommand(command: string): Promise<boolean> {
    const cmd = command.toLowerCase().trim();
    
    switch (cmd) {
      case '/help':
        this.showHelp();
        return true;
      
      case '/clear':
        console.clear();
        displayWelcomeBanner();
        console.log(chalk.green('Chat history cleared!'));
        this.messages = [];
        return true;
      
      case '/history':
        this.showHistory();
        return true;
      
      case '/quit':
      case '/exit':
        console.log(chalk.yellow('👋 Thanks for using Grok CLI! Goodbye!'));
        return false;
      
      default:
        console.log(chalk.red(`Unknown command: ${cmd}`));
        console.log(chalk.gray('Type /help for available commands.'));
        return true;
    }
  }

  private showHelp(): void {
    console.log();
    console.log(chalk.cyan('📚 Available Commands:'));
    console.log(chalk.gray('   /help     ') + chalk.white('- Show this help message'));
    console.log(chalk.gray('   /clear    ') + chalk.white('- Clear chat history'));
    console.log(chalk.gray('   /history  ') + chalk.white('- Show conversation history'));
    console.log(chalk.gray('   /quit     ') + chalk.white('- Exit the chat'));
    console.log();
    console.log(chalk.cyan('💡 Tips:'));
    console.log(chalk.gray('   • ') + chalk.white('Ask questions about coding, debugging, or any topic'));
    console.log(chalk.gray('   • ') + chalk.white('Include code snippets for analysis'));
    console.log(chalk.gray('   • ') + chalk.white('Be specific for better responses'));
    console.log();
  }

  private showHistory(): void {
    if (this.messages.length === 0) {
      console.log(chalk.gray('No conversation history yet.'));
      return;
    }

    console.log();
    console.log(chalk.cyan('📝 Conversation History:'));
    console.log(chalk.gray('─'.repeat(50)));
    
    this.messages.forEach((message, index) => {
      const roleColor = message.role === 'user' ? chalk.blue : chalk.green;
      const roleIcon = message.role === 'user' ? '👤' : '🤖';
      
      console.log();
      console.log(roleColor(`${roleIcon} ${message.role.toUpperCase()}:`));
      console.log(chalk.white(message.content));
    });
    console.log();
    console.log(chalk.gray('─'.repeat(50)));
    console.log();
  }

  private async processUserMessage(input: string): Promise<void> {
    // Add user message to history
    this.messages.push({ role: 'user', content: input });

    console.log();
    
    // Show thinking indicator
    const spinner = ora(chalk.blue('🤔 Thinking...')).start();

    try {
      // Call Grok API
      const response = await this.client!.chat(this.messages);
      
      spinner.stop();
      
      // Extract response content
      const assistantMessage = response.choices[0]?.message?.content || 'Sorry, I couldn\'t generate a response.';
      
      // Add assistant response to history
      this.messages.push({ role: 'assistant', content: assistantMessage });
      
      // Display the response
      console.log(chalk.green('🤖 Grok: ') + chalk.white(assistantMessage));
      console.log();

    } catch (error: any) {
      spinner.stop();
      
      console.log(chalk.red('❌ Error: ') + chalk.white(error.message || 'Failed to get response'));
      
      if (error.statusCode === 401) {
        console.log(chalk.yellow('   Your API key may be invalid. Check your configuration.'));
        console.log(chalk.gray('   Run: ') + chalk.cyan('grok-cli config set-key') + chalk.gray(' to update it.'));
      } else if (error.statusCode === 429) {
        console.log(chalk.yellow('   Rate limit exceeded. Please wait a moment and try again.'));
      }
      
      console.log();
    }
  }
}
