import { GrokAPIClient } from '@grok-cli/core';
import { ConfigManager, logger, Message } from '@grok-cli/shared';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';

interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export async function chatCommand(message?: string, options: ChatOptions = {}) {
  const configManager = ConfigManager.getInstance();
  await configManager.load(); // Ensure config is loaded from disk
  const config = configManager.getAll();

  if (!config.apiKey) {
    logger.error('API key not configured. Run "grok config set-key" to set it.');
    return;
  }

  const client = new GrokAPIClient({
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
  });

  // Fetch user's available models dynamically
  let userModels: any[] = [];
  let selectedModel = options.model;
  
  try {
    userModels = await client.models();
    
    // If no model specified, use the best available model from user's API
    if (!selectedModel && userModels.length > 0) {
      // Prioritize models: grok-4 > grok-3 > grok-2 > others
      let bestModel = userModels[0].id; // Default to first available
      const modelPriority = ['grok-4-0709', 'grok-3', 'grok-3-fast', 'grok-2-1212', 'grok-2-vision-1212'];
      for (const priorityModel of modelPriority) {
        const foundModel = userModels.find(m => m.id === priorityModel);
        if (foundModel) {
          bestModel = foundModel.id;
          break;
        }
      }
      selectedModel = bestModel;
      logger.info(`Using model: ${selectedModel} (${userModels.length} models available)`);
    } else if (!selectedModel) {
      logger.error('No models available in your account.');
      return;
    }
    
    // Validate the specified model exists in user's account
    if (options.model && !userModels.find(m => m.id === options.model)) {
      logger.warn(`Model '${options.model}' not found in your account.`);
      logger.info(`Available models: ${userModels.map(m => m.id).join(', ')}`);
      
      // Fall back to best available model
      let bestModel = userModels[0].id;
      const modelPriority = ['grok-4-0709', 'grok-3', 'grok-3-fast', 'grok-2-1212', 'grok-2-vision-1212'];
      for (const priorityModel of modelPriority) {
        const foundModel = userModels.find(m => m.id === priorityModel);
        if (foundModel) {
          bestModel = foundModel.id;
          break;
        }
      }
      selectedModel = bestModel;
      logger.info(`Using: ${selectedModel}`);
    }
    
  } catch (error) {
    logger.warn('Could not fetch models from API. Using specified model or fallback.');
    selectedModel = options.model || 'grok-beta';
  }
  
  // Update options with the selected model
  const finalOptions = { ...options, model: selectedModel };

  if (message) {
    // Single message mode
    await sendSingleMessage(client, message, finalOptions, userModels);
  } else {
    // Interactive mode
    await startInteractiveSession(client, finalOptions, userModels);
  }
}

async function sendSingleMessage(
  client: GrokAPIClient,
  message: string,
  options: ChatOptions,
  userModels: any[] = []
) {
  const spinner = ora('Thinking...').start();

  try {
    const messages: Message[] = [{ role: 'user', content: message }];

    if (options.stream) {
      spinner.stop();
      process.stdout.write('\n');
      
      for await (const chunk of client.stream(messages, options)) {
        process.stdout.write(chunk);
      }
      process.stdout.write('\n\n');
    } else {
      const response = await client.chat(messages, options);
      spinner.stop();
      
      // Display the response with better formatting
      console.log();
      console.log(chalk.bold.green('Grok:'));
      console.log();
      
      const formattedResponse = formatResponse(response.choices[0].message.content);
      console.log(formattedResponse);
      
      console.log();
      
      if (response.usage) {
        const usage = response.usage;
        logger.info(`Tokens used: ${usage.totalTokens} (${usage.promptTokens} prompt + ${usage.completionTokens} completion)`);
      }
    }
  } catch (error) {
    spinner.stop();
    logger.error(`Failed to get response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function startInteractiveSession(
  client: GrokAPIClient,
  options: ChatOptions,
  userModels: any[] = []
) {
  const modelInfo = userModels.length > 0 
    ? `Using model: ${options.model} (${userModels.length} available)`
    : `Using model: ${options.model}`;
    
  logger.info('Starting interactive chat session. Type "exit" to quit, "clear" to clear history.');
  logger.info(modelInfo);
  
  const messages: Message[] = [];
  
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { message } = await inquirer.prompt([
      {
        type: 'input',
        name: 'message',
        message: 'You:',
        validate: (input: string) => input.trim().length > 0 || 'Please enter a message',
      },
    ]);

    if (message.toLowerCase() === 'exit') {
      logger.info('Goodbye!');
      break;
    }

    if (message.toLowerCase() === 'clear') {
      messages.length = 0;
      logger.info('Chat history cleared.');
      continue;
    }

    messages.push({ role: 'user', content: message });

    const spinner = ora('Thinking...').start();

    try {
      if (options.stream) {
        spinner.stop();
        process.stdout.write('Grok: ');
        
        let response = '';
        for await (const chunk of client.stream(messages, options)) {
          process.stdout.write(chunk);
          response += chunk;
        }
        process.stdout.write('\n\n');
        
        messages.push({ role: 'assistant', content: response });
      } else {
        const response = await client.chat(messages, options);
        spinner.stop();
        
        const assistantMessage = response.choices[0].message.content;
        console.log(`\nGrok: ${assistantMessage}\n`);
        
        messages.push({ role: 'assistant', content: assistantMessage });
      }
    } catch (error) {
      spinner.stop();
      logger.error(`Failed to get response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

function formatResponse(text: string): string {
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
