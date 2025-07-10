import { GrokAPIClient } from '@grok-cli/core';
import { ConfigManager, logger, Message } from '@grok-cli/shared';
import inquirer from 'inquirer';
import ora from 'ora';

interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export async function chatCommand(message?: string, options: ChatOptions = {}) {
  const configManager = ConfigManager.getInstance();
  const config = configManager.getAll();

  if (!config.apiKey) {
    logger.error('API key not configured. Run "grok config set-key" to set it.');
    return;
  }

  const client = new GrokAPIClient({
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
  });

  if (message) {
    // Single message mode
    await sendSingleMessage(client, message, options);
  } else {
    // Interactive mode
    await startInteractiveSession(client, options);
  }
}

async function sendSingleMessage(
  client: GrokAPIClient,
  message: string,
  options: ChatOptions
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
      
      console.log('\n' + response.choices[0].message.content + '\n');
      
      if (response.usage) {
        logger.info(`Tokens used: ${response.usage.totalTokens} (${response.usage.promptTokens} prompt + ${response.usage.completionTokens} completion)`);
      }
    }
  } catch (error) {
    spinner.stop();
    logger.error(`Failed to get response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function startInteractiveSession(
  client: GrokAPIClient,
  options: ChatOptions
) {
  logger.info('Starting interactive chat session. Type "exit" to quit, "clear" to clear history.');
  
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
