# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-07-10

### Added
- Initial release of Grok CLI
- Interactive chat mode with xAI's Grok models
- Single message mode for quick queries
- Configuration management system
- API key management with secure storage
- Code analysis capabilities
- File system integration with smart filtering
- Context management for large codebases
- Streaming response support
- Multiple model support (grok-beta, grok-2, etc.)
- Git repository detection
- TypeScript support throughout
- Comprehensive error handling
- Rate limiting compliance
- Monorepo architecture with separate packages:
  - `@grok-cli/shared`: Common utilities and types
  - `@grok-cli/core`: API client and core logic
  - `grok-cli`: Main CLI application

### Features
- **Commands**:
  - `grok` - Interactive chat or single message
  - `grok config` - Configuration management
  - `grok analyze` - Code analysis
- **Configuration**:
  - Environment variable support
  - Persistent configuration storage
  - Model and parameter customization
- **File Processing**:
  - Recursive directory analysis
  - File type filtering
  - Large file handling
  - Git integration
- **Developer Experience**:
  - Real-time streaming responses
  - Beautiful terminal output
  - Comprehensive help system
  - Debug mode support

### Technical Details
- Built with TypeScript for type safety
- Uses Commander.js for CLI parsing
- Axios for HTTP client with error handling
- Inquirer for interactive prompts
- Ora for loading spinners
- fs-extra for enhanced file operations
- Chalk for colorized output

### Documentation
- Comprehensive README with usage examples
- API documentation for all packages
- Example configurations and use cases
- Troubleshooting guide
- Contributing guidelines

### Infrastructure
- ESLint and Prettier for code quality
- Jest testing framework setup
- GitHub Actions workflow templates
- VS Code integration examples
- Build scripts and development tools

## [0.0.1] - 2025-07-10

### Added
- Project initialization
- Basic project structure
- Initial monorepo setup
