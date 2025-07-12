# Grok CLI
![GvgwDzwWQAAJMTh](https://github.com/user-attachments/assets/cb2e8b00-3129-46c1-8161-887901906269)

A powerful command-line interface for xAI's Grok models, providing developers with terminal access to Grok's capabilities for code analysis, generation, and workflow automation.

## Features

- **Beautiful Interface**: Clean terminal UI with intuitive design
- **Interactive Chat**: Start conversations with Grok directly from your terminal
- **In-Chat Project Creation**: Create new projects by simply saying "create a React app" or "build me a Python CLI tool"
- **Project Scaffolding**: Generate complete project structures with AI assistance
- **Code Analysis**: Analyze entire codebases and get architectural insights
- **Smart Setup**: Automatic first-time setup with API key configuration
- **Multiple Models**: Support for all available Grok models
- **Developer Tools**: Git integration, file type detection, and more

## Quick Installation

### Option 1: One-line Install (Recommended)
```bash
git clone https://github.com/0xgillus/grok-cli && cd grok-cli && ./install.sh
```

### Option 2: Manual Installation
```bash
git clone https://github.com/0xgillus/grok-cli
cd grok-cli
npm install
npm run build
npm run link:cli
```

### Option 3: From npm (when published)
```bash
npm install -g grok-cli
```

## Getting Started

Simply run the CLI and follow the setup wizard:

```bash
grok-cli
# or use the shorter alias:
grok
```

On first run, you'll see a welcome screen that guides you through:
1. **API Key Setup** - Enter your xAI API key
2. **Configuration** - Set your preferred defaults
3. **API key setup** with validation
4. **Ready to chat** confirmation

### First Time Experience

```
  ██████╗  ██████╗  ██████╗  ██╗  ██╗     ██████╗ ██╗      ██╗
 ██╔════╝  ██╔══██╗ ██╔═══██╗ ██║ ██╔╝    ██╔════╝ ██║      ██║
 ██║  ███╗ ██████╔╝ ██║   ██║ █████╔╝     ██║      ██║      ██║
 ██║   ██║ ██╔══██╗ ██║   ██║ ██╔═██╗     ██║      ██║      ██║
 ╚██████╔╝ ██║  ██║ ╚██████╔╝ ██║  ██╗    ╚██████╗ ███████╗ ██║
  ╚═════╝  ╚═╝  ╚═╝  ╚═════╝  ╚═╝  ╚═╝     ╚═════╝ ╚══════╝ ╚═╝

                      Command-line interface for xAI's Grok models

Tips for getting started:
1. Ask questions, edit files, or run commands.
2. Be specific for the best results.
3. Create GROK.md files to customize your interactions with Grok.
4. /help for more information.

First time setup required
──────────────────────────────────────────────────
To get started with Grok CLI, you need to configure your xAI API key.

How to get your API key:
   1. Visit https://console.x.ai/
   2. Sign in to your xAI account
   3. Navigate to API Keys section
   4. Create a new API key

? Would you like to set up your xAI API key now? (Y/n) 
```

## Commands

### Chat Commands
```bash
# Interactive mode
grok

# Single message
grok "Explain this function"

# With options
grok "Write a Python function" --model grok-2 --stream
```

### Project Creation
```bash
# Command-line project creation
grok create

# Interactive project setup
grok create my-awesome-app

# Specific project type
grok create my-api --type api --framework express

# In-chat creation (while in interactive mode)
# Just say things like:
# "Create a React todo app"
# "Build me a Python CLI tool"
# "Make an Express API server"
```

### Configuration
```bash
# Set API key
grok config set-key [key]

# Set default model
grok config set-model grok-beta

# Show current config
grok config show

# Reset configuration
grok config reset
```

### Code Analysis
```bash
# Analyze current directory
grok analyze .

# Analyze specific path
grok analyze ./src

# Filter by file extensions
grok analyze . --extensions js,ts,jsx,tsx

# Recursive analysis
grok analyze . --recursive
```

## Configuration

The CLI stores configuration in `~/.grok-cli/config.json`. You can also use environment variables:

- `GROK_API_KEY`: Your xAI API key
- `GROK_BASE_URL`: Custom API base URL (default: https://api.x.ai/v1)

## API Key

Get your API key from [xAI Developer Portal](https://docs.x.ai/). The CLI supports multiple ways to provide your API key:

1. **Environment variable** (recommended):
   ```bash
   export GROK_API_KEY="your-key-here"
   ```

2. **Configuration command**:
   ```bash
   grok config set-key your-key-here
   ```

3. **Interactive prompt**:
   ```bash
   grok config set-key
   # Will prompt securely for the key
   ```

## Examples

### Interactive Chat Session
```bash
$ grok
Starting interactive chat session. Type "exit" to quit, "clear" to clear history.
You: What is the difference between TypeScript and JavaScript?
Grok: TypeScript is a superset of JavaScript that adds static type checking...

You: Create a React todo app
Project creation detected!
? Create a web-app project called "todo-app"? Yes
Generating project structure...
Project created successfully!

You: exit
Goodbye!
```

### Project Creation Examples
```bash
# Command-line creation
$ grok create
? Project name: my-awesome-project
? Project type: Web Application
? Framework: React
? Language: TypeScript
Generating project structure...
Project created successfully!

# Quick creation with parameters
$ grok create my-api --type api --framework express --language typescript
Generating project structure...
Project created successfully!
```

### In-Chat Project Creation Examples
While in interactive chat mode, you can naturally ask for projects:
- **"Create a React todo app"** → Generates a React TypeScript todo application
- **"Build me a Python CLI tool"** → Creates a Python command-line interface
- **"Make an Express API server"** → Scaffolds an Express.js REST API
- **"Generate a Vue.js dashboard"** → Creates a Vue.js admin dashboard
- **"Create a mobile app with React Native"** → Sets up a React Native project

### Code Analysis
```bash
$ grok analyze ./packages/core
CODEBASE ANALYSIS REPORT
============================================================
Path: ./packages/core
Files analyzed: 12
Total tokens: 2,450
============================================================

## Architecture & Structure
This appears to be a well-organized TypeScript package with a clear separation of concerns...

## Code Quality
The code follows TypeScript best practices with proper type definitions...
```

### Single Message with Streaming
```bash
$ grok "Generate a REST API endpoint in Express.js" --stream
Here's a complete REST API endpoint using Express.js:

```javascript
const express = require('express');
const app = express();
...
```

## Development

This project uses a monorepo structure:

```
grok-cli/
├── packages/
│   ├── cli/           # Main CLI application
│   ├── core/          # Core API client and logic
│   └── shared/        # Shared utilities and types
├── docs/              # Documentation
├── examples/          # Usage examples
└── tests/            # Test suites
```

### Building from Source

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run in development mode
npm run dev

# Run tests
npm test

# Lint code
npm run lint
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run the test suite
6. Submit a pull request

## Troubleshooting

### Common Issues

**"API key not configured"**
- Set your API key using `grok config set-key` or the `GROK_API_KEY` environment variable

**"Network error: Unable to connect to xAI API"**
- Check your internet connection
- Verify the API endpoint is accessible
- Check if you need to configure a proxy

**"Authentication failed: Invalid API key"**
- Verify your API key is correct
- Check if your API key has the necessary permissions

**"Rate limit exceeded"**
- Wait a moment before making another request
- Consider upgrading your API plan if you need higher limits

### Debug Mode

Enable debug logging:
```bash
DEBUG=1 grok "your message"
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## Support

- 📖 [Documentation](https://github.com/0xgillus/grok-cli/docs)
- [Issue Tracker](https://github.com/0xgillus/grok-cli/issues)
- [Discussions](https://github.com/0xgillus/grok-cli/discussions)
