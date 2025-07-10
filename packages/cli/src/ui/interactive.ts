import inquirer from 'inquirer';
import chalk from 'chalk';
import { GrokAPIClient } from '@grok-cli/core';
import { ConfigManager, logger, Message } from '@grok-cli/shared';
import { displayWelcomeBanner, displayContextInfo } from './banner';
import { runFirstTimeSetup } from './onboarding';
import ora from 'ora';

export class InteractiveChat {
  private client?: GrokAPIClient;
  private messages: Message[] = [];
  private configManager: ConfigManager;
  private config: any;
  private userModels: any[] = [];
  private currentModel: string = '';
  private maxContextLength: number = 32768;

  constructor() {
    this.configManager = ConfigManager.getInstance();
  }

  // Rough token estimation (4 chars ≈ 1 token for English text)
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private calculateUsedTokens(): number {
    return this.messages.reduce((total, message) => {
      return total + this.estimateTokens(message.content);
    }, 0);
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

    // Fetch user's models dynamically
    try {
      this.userModels = await this.client.models();
      if (this.userModels.length > 0) {
        // Prioritize models: grok-4 > grok-3 > grok-2 > others
        let preferredModel = this.userModels[0].id; // Default to first available
        
        // Look for the best available model in order of preference
        const modelPriority = ['grok-4-0709', 'grok-3', 'grok-3-fast', 'grok-2-1212', 'grok-2-vision-1212'];
        for (const priorityModel of modelPriority) {
          const foundModel = this.userModels.find(m => m.id === priorityModel);
          if (foundModel) {
            preferredModel = foundModel.id;
            break;
          }
        }
        
        // If a configured model exists in the user's available models, use that instead
        if (this.config.defaultModel) {
          const configuredModel = this.userModels.find(m => m.id === this.config.defaultModel);
          if (configuredModel) {
            preferredModel = configuredModel.id;
          }
        }
        
        this.currentModel = preferredModel;
        
        // Get context length for the selected model
        const selectedModel = this.userModels.find(m => m.id === this.currentModel);
        this.maxContextLength = selectedModel?.contextLength || 32768;
        
        logger.info(`Using model: ${this.currentModel} (${this.userModels.length} available)`);
        logger.info(`Context length: ${this.maxContextLength.toLocaleString()} tokens`);
      } else {
        logger.error('No models available in your account.');
        return;
      }
    } catch (error) {
      logger.warn('Could not fetch models from API. Using fallback.');
      this.currentModel = 'grok-beta'; // Use a generic fallback
    }

    // Start the chat loop
    await this.chatLoop();
  }

  private async chatLoop(): Promise<void> {
    // Display context info with real model data
    const usedTokens = this.calculateUsedTokens();
    await displayContextInfo(this.currentModel, this.maxContextLength, usedTokens);

    console.log(chalk.green('Ready to chat! Type ') + chalk.cyan('/help') + chalk.green(' for commands or ') + chalk.cyan('/quit') + chalk.green(' to exit.'));
    console.log();

    // eslint-disable-next-line no-constant-condition
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
          console.log(chalk.yellow('Thanks for using Grok CLI! Goodbye!'));
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
        validate: (_input: string) => {
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
        console.log(chalk.yellow('Thanks for using Grok CLI! Goodbye!'));
        return false;
      
      default:
        console.log(chalk.red(`Unknown command: ${cmd}`));
        console.log(chalk.gray('Type /help for available commands.'));
        return true;
    }
  }

  private showHelp(): void {
    console.log();
    console.log(chalk.cyan('Available Commands:'));
    console.log(chalk.gray('   /help     ') + chalk.white('- Show this help message'));
    console.log(chalk.gray('   /clear    ') + chalk.white('- Clear chat history'));
    console.log(chalk.gray('   /history  ') + chalk.white('- Show conversation history'));
    console.log(chalk.gray('   /quit     ') + chalk.white('- Exit the chat'));
    console.log();
    console.log(chalk.cyan('Tips:'));
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
    console.log(chalk.cyan('Conversation History:'));
    console.log(chalk.gray('─'.repeat(50)));
    
    this.messages.forEach((message) => {
      const roleColor = message.role === 'user' ? chalk.blue : chalk.green;
      const roleIcon = message.role === 'user' ? 'USER' : 'ASSISTANT';
      
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
    const spinner = ora(chalk.blue('Thinking...')).start();

    try {
      // Call Grok API with dynamic model
      const response = await this.client!.chat(this.messages, { 
        model: this.currentModel 
      });
      
      spinner.stop();
      
      // Extract response content
      const assistantMessage = response.choices[0]?.message?.content || 'Sorry, I couldn\'t generate a response.';
      
      // Add assistant response to history
      this.messages.push({ role: 'assistant', content: assistantMessage });
      
      // Display the response with better formatting
      console.log();
      console.log(chalk.bold.green('Grok:'));
      console.log();
      
      // Format the response with proper styling
      const formattedResponse = this.formatResponse(assistantMessage);
      console.log(formattedResponse);
      
      console.log();
      
      // Show updated context usage
      const usedTokens = this.calculateUsedTokens();
      const availableTokens = this.maxContextLength - usedTokens;
      const percentageLeft = Math.max(0, (availableTokens / this.maxContextLength) * 100);
      
      let contextStatus;
      let percentDisplay;
      
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
      
      console.log(chalk.gray('Context: ') + contextStatus);
      console.log();

    } catch (error: any) {
      spinner.stop();
      
      console.log(chalk.red('Error: ') + chalk.white(error.message || 'Failed to get response'));
      
      if (error.statusCode === 401) {
        console.log(chalk.yellow('   Your API key may be invalid. Check your configuration.'));
        console.log(chalk.gray('   Run: ') + chalk.cyan('grok-cli config set-key') + chalk.gray(' to update it.'));
      } else if (error.statusCode === 429) {
        console.log(chalk.yellow('   Rate limit exceeded. Please wait a moment and try again.'));
      }
      
      console.log();
    }
  }

  private formatResponse(text: string): string {
    // Split response into lines for better formatting
    const lines = text.split('\n');
    let formattedLines: string[] = [];
    let inCodeBlock = false;
    let codeLanguage = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Handle code blocks
      if (line.startsWith('```')) {
        if (!inCodeBlock) {
          // Starting code block
          inCodeBlock = true;
          codeLanguage = line.substring(3).trim();
          formattedLines.push(chalk.dim.gray('┌─ Code ') + chalk.cyan(codeLanguage || 'block') + chalk.dim.gray(' ─'.repeat(40 - (codeLanguage.length + 10))));
        } else {
          // Ending code block
          inCodeBlock = false;
          formattedLines.push(chalk.dim.gray('└' + '─'.repeat(47)));
        }
        continue;
      }
      
      if (inCodeBlock) {
        // Code content with syntax highlighting colors
        formattedLines.push(chalk.dim.gray('│ ') + chalk.hex('#a8e6cf')(line));
      } else {
        // Regular text formatting
        let formattedLine = line;
        
        // Style different text patterns
        // Bold text (**text**)
        formattedLine = formattedLine.replace(/\*\*(.*?)\*\*/g, (match, p1) => chalk.bold.white(p1));
        
        // Italic text (*text*)
        formattedLine = formattedLine.replace(/\*(.*?)\*/g, (match, p1) => chalk.italic.gray(p1));
        
        // Inline code (`code`)
        formattedLine = formattedLine.replace(/`([^`]+)`/g, (match, p1) => chalk.bgBlackBright.hex('#a8e6cf')(' ' + p1 + ' '));
        
        // Headers (# text)
        if (line.startsWith('# ')) {
          formattedLine = chalk.bold.hex('#4ECDC4')(line);
        } else if (line.startsWith('## ')) {
          formattedLine = chalk.bold.hex('#45B7D1')(line);
        } else if (line.startsWith('### ')) {
          formattedLine = chalk.bold.hex('#96CEB4')(line);
        }
        
        // Bullet points
        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
          formattedLine = formattedLine.replace(/^(\s*)([-*])(\s)/, '$1' + chalk.cyan('•') + '$3');
        }
        
        // Numbers in lists
        if (/^\s*\d+\.\s/.test(line)) {
          formattedLine = formattedLine.replace(/^(\s*)(\d+)(\.\s)/, '$1' + chalk.cyan('$2') + chalk.dim('$3'));
        }
        
        // Apply base color to regular text
        if (formattedLine === line && line.trim() !== '') {
          formattedLine = chalk.hex('#E8F5E8')(line);
        }
        
        formattedLines.push(formattedLine);
      }
    }
    
    return formattedLines.join('\n');
  }
}
