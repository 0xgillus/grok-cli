import chalk from 'chalk';

export const logger = {
  info: (message: string) => console.log(chalk.blue('INFO'), message),
  success: (message: string) => console.log(chalk.green('SUCCESS'), message),
  warn: (message: string) => console.log(chalk.yellow('WARN'), message),
  error: (message: string) => console.log(chalk.red('ERROR'), message),
  debug: (message: string) => {
    if (process.env.DEBUG) {
      console.log(chalk.gray('DEBUG'), message);
    }
  },
};

export const spinner = {
  start: (message: string) => {
    process.stdout.write(chalk.blue('⠋') + ' ' + message);
  },
  stop: (success = true, finalMessage?: string) => {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    if (finalMessage) {
      if (success) {
        logger.success(finalMessage);
      } else {
        logger.error(finalMessage);
      }
    }
  },
};
