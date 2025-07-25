#!/usr/bin/env node

import { Command } from 'commander';
import { ConfigManager, logger } from '@grok-cli/shared';
import { chatCommand } from '../commands/chat';
import { configCommand } from '../commands/config';
import { analyzeCommand } from '../commands/analyze';
import { createCommand } from '../commands/create';
import { InteractiveChat } from '../ui/interactive';

const program = new Command();

async function main() {
  try {
    program
      .name('grok')
      .description('Command-line interface for xAI\'s Grok models')
      .version('0.1.0');

    // Load configuration
    const configManager = ConfigManager.getInstance();
    await configManager.load();

    // Register commands
    program
      .command('chat')
      .description('Start an interactive chat session or send a single message')
      .argument('[message]', 'Message to send (if not provided, starts interactive mode)')
      .option('-m, --model <model>', 'Model to use (defaults to best available model)')
      .option('-t, --temperature <temp>', 'Temperature for response generation', parseFloat)
      .option('--max-tokens <tokens>', 'Maximum tokens for response', parseInt)
      .option('-s, --stream', 'Stream the response')
      .action(chatCommand);

    program
      .addCommand(configCommand);

    program
      .command('create')
      .description('Create a new project from scratch')
      .argument('[name]', 'Project name')
      .option('-t, --type <type>', 'Project type (web-app, api, cli, library, mobile, desktop, game, custom)')
      .option('-f, --framework <framework>', 'Framework to use')
      .option('-l, --language <language>', 'Programming language')
      .option('-d, --description <description>', 'Project description')
      .option('-m, --model <model>', 'Model to use for generation (will prompt if not specified)')
      .action(createCommand);

    program
      .command('analyze')
      .description('Analyze files or directories')
      .argument('<path>', 'Path to analyze')
      .option('-r, --recursive', 'Analyze directories recursively')
      .option('-e, --extensions <extensions>', 'File extensions to include (comma-separated)')
      .action(analyzeCommand);

    // Default behavior: start beautiful interactive chat if no arguments
    if (process.argv.length === 2) {
      const interactiveChat = new InteractiveChat();
      await interactiveChat.start();
      return;
    }

    await program.parseAsync();
  } catch (error) {
    logger.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
