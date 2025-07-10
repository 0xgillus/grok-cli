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
    console.log(chalk.cyan('🎯 Smart Project Creation:'));
    console.log(chalk.white('Just describe what you want to build naturally!'));
    console.log();
    console.log(chalk.yellow('Examples:'));
    console.log(chalk.gray('   • ') + chalk.green('"Create a React todo app"'));
    console.log(chalk.gray('   • ') + chalk.green('"Build me a Python CLI tool"'));
    console.log(chalk.gray('   • ') + chalk.green('"Make an Express API server"'));
    console.log(chalk.gray('   • ') + chalk.green('"Generate a Vue.js dashboard"'));
    console.log(chalk.gray('   • ') + chalk.green('"Create a mobile app with React Native"'));
    console.log(chalk.gray('   • ') + chalk.green('"Build a FastAPI backend"'));
    console.log(chalk.gray('   • ') + chalk.green('"Make a Next.js blog website"'));
    console.log();
    console.log(chalk.cyan('Tips:'));
    console.log(chalk.gray('   • ') + chalk.white('Ask questions about coding, debugging, or any topic'));
    console.log(chalk.gray('   • ') + chalk.white('Include code snippets for analysis'));
    console.log(chalk.gray('   • ') + chalk.white('Be specific for better responses'));
    console.log(chalk.gray('   • ') + chalk.white('Project creation works in any conversation'));
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
    // Check if this is a project creation request
    if (this.isProjectCreationRequest(input)) {
      await this.handleProjectCreation(input);
      return;
    }

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

  private isProjectCreationRequest(input: string): boolean {
    const lowerInput = input.toLowerCase();
    
    // Keywords that indicate project creation
    const creationKeywords = [
      'create', 'build', 'make', 'generate', 'scaffold', 'setup', 'start',
      'new project', 'new app', 'new api', 'new cli', 'new website',
      'bootstrap', 'initialize', 'init', 'develop', 'craft'
    ];
    
    // Project type keywords
    const projectTypes = [
      'react app', 'vue app', 'svelte app', 'angular app', 'web app', 'website', 'frontend',
      'api', 'rest api', 'graphql api', 'backend', 'server', 'microservice',
      'cli tool', 'command line', 'terminal app', 'script',
      'mobile app', 'react native', 'flutter app', 'ios app', 'android app',
      'desktop app', 'electron app', 'tauri app',
      'game', 'python script', 'node app', 'express app', 'fastapi',
      'typescript project', 'javascript project', 'next.js', 'nuxt.js',
      'django app', 'flask app', 'laravel app', 'rails app',
      'discord bot', 'telegram bot', 'chatbot', 'bot',
      'library', 'package', 'npm package', 'component library',
      'dashboard', 'admin panel', 'cms', 'blog', 'portfolio',
      'todo app', 'calculator', 'weather app', 'chat app'
    ];
    
    // Check if input contains creation intent + project type
    const hasCreationIntent = creationKeywords.some(keyword => lowerInput.includes(keyword));
    const hasProjectType = projectTypes.some(type => lowerInput.includes(type));
    
    // Also check for direct project creation patterns
    const directPatterns = [
      /\b(want|need)\s+(a|an)\s+.*(app|website|api|tool|project|bot)/,
      /can you\s+(create|make|build|generate)/,
      /please\s+(create|make|build|generate)/,
      /i want to\s+(create|make|build)/,
      /help me\s+(create|make|build)/
    ];
    
    const hasDirectPattern = directPatterns.some(pattern => pattern.test(lowerInput));
    
    return (hasCreationIntent && hasProjectType) || hasDirectPattern;
  }

  private async handleProjectCreation(input: string): Promise<void> {
    console.log();
    console.log(chalk.cyan('🎯 Smart project creation detected!'));
    console.log(chalk.gray('Analyzing your request with AI...'));
    console.log();
    
    const spinner = ora(chalk.blue('Parsing project details...')).start();
    
    try {
      // Parse the project details from the user's message
      const projectDetails = await this.parseProjectRequest(input);
      
      spinner.stop();
      
      console.log(chalk.green('✅ Project details extracted:'));
      console.log(chalk.gray('   Name: ') + chalk.white(projectDetails.name));
      console.log(chalk.gray('   Type: ') + chalk.cyan(projectDetails.type));
      if (projectDetails.framework) {
        console.log(chalk.gray('   Framework: ') + chalk.yellow(projectDetails.framework));
      }
      console.log(chalk.gray('   Language: ') + chalk.magenta(projectDetails.language));
      if (projectDetails.description) {
        console.log(chalk.gray('   Description: ') + chalk.dim(projectDetails.description));
      }
      console.log();
      
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Create this project?`,
          default: true
        }
      ]);
      
      if (!confirm) {
        console.log(chalk.yellow('Project creation cancelled.'));
        console.log(chalk.gray('You can always try again or use: ') + chalk.cyan('grok create'));
        return;
      }
      
      console.log();
      console.log(chalk.blue('🚀 Creating your project...'));
      
      // Import and use the create command
      const { createCommand } = await import('../commands/create');
      await createCommand(projectDetails.name, {
        type: projectDetails.type,
        framework: projectDetails.framework,
        language: projectDetails.language,
        description: projectDetails.description
      });
      
      console.log();
      console.log(chalk.green('🎉 Your project is ready! Continue chatting or type /quit to exit.'));
      
    } catch (error: any) {
      spinner.stop();
      console.log();
      console.log(chalk.red('❌ Failed to create project: ') + error.message);
      console.log();
      console.log(chalk.yellow('💡 You can also try:'));
      console.log(chalk.gray('   • ') + chalk.cyan('grok create') + chalk.gray(' for interactive creation'));
      console.log(chalk.gray('   • ') + chalk.cyan('grok create --help') + chalk.gray(' for all options'));
      console.log(chalk.gray('   • Rephrase your request and try again'));
    }
  }

  private async parseProjectRequest(input: string): Promise<any> {
    // Use Grok to parse the user's natural language request
    const parsePrompt = `Parse this project creation request and extract the details. Be intelligent about inferring reasonable defaults.

User request: "${input}"

Extract and return ONLY a valid JSON object with these fields:
{
  "name": "suggested project name (kebab-case, descriptive)",
  "type": "project type (web-app, api, cli, library, mobile, desktop, game, or custom)",
  "framework": "suggested framework (if applicable, can be null)",
  "language": "suggested programming language (javascript, typescript, python, etc.)",
  "description": "brief description of what the user wants"
}

Guidelines:
- Use descriptive names: "todo-app" not "my-project"
- Choose appropriate types: web-app for React/Vue, api for Express/FastAPI, cli for command tools
- Prefer TypeScript for modern web projects
- Be smart about framework selection based on context
- Keep descriptions concise but informative

Examples:
- "create a React todo app" → {"name": "todo-app", "type": "web-app", "framework": "react", "language": "typescript", "description": "Todo application with React"}
- "build me a Python CLI tool for file management" → {"name": "file-manager-cli", "type": "cli", "framework": "click", "language": "python", "description": "Command line tool for file management"}
- "make an Express API for a blog" → {"name": "blog-api", "type": "api", "framework": "express", "language": "typescript", "description": "REST API for blog application"}
- "I want a Vue.js dashboard" → {"name": "admin-dashboard", "type": "web-app", "framework": "vue", "language": "typescript", "description": "Admin dashboard with Vue.js"}

Return ONLY the JSON object, no other text:`;

    const response = await this.client!.chat([
      { role: 'user', content: parsePrompt }
    ], { 
      model: this.currentModel 
    });
    
    try {
      const content = response.choices[0].message.content;
      
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validate and sanitize the parsed data
        return {
          name: this.sanitizeProjectName(parsed.name || 'my-project'),
          type: this.validateProjectType(parsed.type || 'custom'),
          framework: parsed.framework || null,
          language: parsed.language || 'javascript',
          description: parsed.description || input
        };
      }
    } catch (error) {
      // JSON parsing failed
    }
    
    // Fallback: basic parsing with smarter defaults
    const lowerInput = input.toLowerCase();
    
    let type = 'custom';
    let framework = null;
    let language = 'javascript';
    let name = 'my-project';
    
    // Detect project type
    if (lowerInput.includes('react') || lowerInput.includes('vue') || lowerInput.includes('web app') || lowerInput.includes('website')) {
      type = 'web-app';
      language = 'typescript';
    } else if (lowerInput.includes('api') || lowerInput.includes('server') || lowerInput.includes('backend')) {
      type = 'api';
      language = 'typescript';
    } else if (lowerInput.includes('cli') || lowerInput.includes('command line') || lowerInput.includes('terminal')) {
      type = 'cli';
    } else if (lowerInput.includes('mobile') || lowerInput.includes('react native')) {
      type = 'mobile';
      language = 'typescript';
    }
    
    // Detect framework
    if (lowerInput.includes('react')) framework = 'react';
    else if (lowerInput.includes('vue')) framework = 'vue';
    else if (lowerInput.includes('express')) framework = 'express';
    else if (lowerInput.includes('fastapi')) framework = 'fastapi';
    else if (lowerInput.includes('flask')) framework = 'flask';
    
    // Detect language
    if (lowerInput.includes('python')) language = 'python';
    else if (lowerInput.includes('typescript')) language = 'typescript';
    else if (lowerInput.includes('javascript')) language = 'javascript';
    
    // Generate name from description
    if (lowerInput.includes('todo')) name = 'todo-app';
    else if (lowerInput.includes('blog')) name = 'blog-app';
    else if (lowerInput.includes('dashboard')) name = 'dashboard';
    else if (lowerInput.includes('api')) name = 'api-server';
    else if (lowerInput.includes('cli')) name = 'cli-tool';
    
    return {
      name,
      type,
      framework,
      language,
      description: input
    };
  }
  
  private sanitizeProjectName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      || 'my-project';
  }
  
  private validateProjectType(type: string): string {
    const validTypes = ['web-app', 'api', 'cli', 'library', 'mobile', 'desktop', 'game', 'custom'];
    return validTypes.includes(type) ? type : 'custom';
  }
}
