const chalk = require('chalk');

/**
 * Greets the user with the provided name or defaults to 'World'
 * @param {string} [name] - The name to greet
 */
function greet(name = 'World') {
  console.log(chalk.green(`Hello, ${name}!`));
}

module.exports = {
  greet,
};