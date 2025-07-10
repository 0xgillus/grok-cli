#!/usr/bin/env node

const { program } = require('commander');
const { version } = require('../package.json');
const { greet } = require('../src/index');

// Set version
program.version(version, '-v, --version', 'output the current version');

// Greet command
program
  .command('greet [name]')
  .description('Greets the specified name or defaults to "World"')
  .action((name) => {
    greet(name);
  });

// Parse arguments
program.parse(process.argv);

// Show help if no arguments are provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}