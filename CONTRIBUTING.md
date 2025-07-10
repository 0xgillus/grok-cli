# Contributing to Grok CLI

Thank you for your interest in contributing to Grok CLI! This document provides guidelines and information for contributors.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. We expect all contributors to be respectful and professional.

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm 8+
- Git
- xAI API key for testing

### Development Setup

1. **Fork and clone the repository**:
   ```bash
   git clone https://github.com/0xgillus/grok-cli.git
   cd grok-cli
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the project**:
   ```bash
   npm run build
   ```

4. **Set up your API key for testing**:
   ```bash
   export GROK_API_KEY="your-test-api-key"
   ```

5. **Test the CLI**:
   ```bash
   cd packages/cli
   npm start "Hello, Grok!"
   ```

## Project Structure

```
grok-cli/
├── packages/
│   ├── cli/           # Main CLI application
│   ├── core/          # Core API client and logic  
│   └── shared/        # Shared utilities and types
├── docs/              # Documentation
├── examples/          # Usage examples
├── tests/            # Test suites
├── scripts/          # Build and utility scripts
└── README.md
```

## Development Workflow

### 1. Branch Strategy

- `main` - Production-ready code
- `develop` - Development branch
- `feature/feature-name` - Feature branches
- `fix/bug-description` - Bug fix branches

### 2. Making Changes

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our coding standards

3. **Test your changes**:
   ```bash
   npm run test
   npm run lint
   npm run typecheck
   ```

4. **Build and test the CLI**:
   ```bash
   npm run build
   cd packages/cli && npm start
   ```

### 3. Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: add streaming support for chat responses
fix: handle network errors gracefully
docs: update installation instructions
test: add unit tests for config manager
refactor: improve error handling in API client
```

Types:
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `test`: Test additions/modifications
- `refactor`: Code refactoring
- `style`: Code style changes
- `chore`: Build process or auxiliary tool changes

### 4. Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new functionality
3. **Ensure all checks pass**:
   - Tests pass
   - Linting passes
   - TypeScript compilation succeeds
   - Build succeeds

4. **Create a pull request** with:
   - Clear title and description
   - Reference to related issues
   - Screenshots/demos if applicable

5. **Code review process**:
   - At least one maintainer review required
   - Address feedback promptly
   - Keep PR focused and reasonably sized

## Coding Standards

### TypeScript Guidelines

- Use strict TypeScript configuration
- Provide explicit return types for functions
- Use interfaces for object types
- Prefer `const` over `let` when possible
- Use meaningful variable and function names

### Code Style

- Use Prettier for formatting (configured in `.prettierrc`)
- Follow ESLint rules (configured in `.eslintrc.js`)
- Maximum line length: 80 characters
- Use camelCase for variables and functions
- Use PascalCase for classes and interfaces

### Error Handling

- Always handle errors gracefully
- Provide meaningful error messages
- Use typed error objects when possible
- Log errors appropriately

### Testing

- Write unit tests for new functionality
- Test error conditions
- Use descriptive test names
- Aim for good test coverage

## Package-Specific Guidelines

### @grok-cli/shared

- Contains types, utilities, and configuration
- Should have minimal dependencies
- All exports should be well-documented
- Changes here affect all other packages

### @grok-cli/core

- Contains API client and business logic
- Should handle all API interactions
- Implement proper error handling and retries
- Test with actual API calls when possible

### grok-cli (CLI package)

- Contains user interface and command handling
- Focus on user experience
- Provide helpful error messages
- Test interactive flows

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests for specific package
cd packages/shared && npm test
cd packages/core && npm test
cd packages/cli && npm test

# Run tests in watch mode
npm test -- --watch
```

### Test Types

1. **Unit Tests**: Test individual functions and classes
2. **Integration Tests**: Test API client integration
3. **E2E Tests**: Test complete CLI workflows

### Test Guidelines

- Test both success and error cases
- Mock external dependencies
- Use descriptive test descriptions
- Keep tests focused and isolated

## Documentation

### Code Documentation

- Use JSDoc comments for public APIs
- Document complex algorithms
- Include usage examples
- Keep documentation up to date

### User Documentation

- Update README.md for user-facing changes
- Add examples for new features
- Update help text and error messages
- Consider adding to examples/ directory

## Release Process

1. **Version Bump**: Update version in all package.json files
2. **Changelog**: Update CHANGELOG.md with new features and fixes
3. **Testing**: Run full test suite
4. **Build**: Ensure clean build
5. **Tag**: Create git tag for version
6. **Publish**: Publish to npm (maintainers only)

## Getting Help

### Resources

- 📖 [Project Documentation](README.md)
- 🐛 [Issue Tracker](https://github.com/0xgillus/grok-cli/issues)
- 💬 [Discussions](https://github.com/0xgillus/grok-cli/discussions)

### Communication

- Use GitHub Issues for bug reports and feature requests
- Use GitHub Discussions for questions and general discussion
- Be respectful and constructive in all interactions

### Reporting Issues

When reporting bugs, please include:

1. **Environment**: OS, Node.js version, npm version
2. **Steps to reproduce**: Exact commands and inputs
3. **Expected behavior**: What should have happened
4. **Actual behavior**: What actually happened
5. **Error messages**: Full error output
6. **Additional context**: Any other relevant information

## Feature Requests

For new features:

1. **Check existing issues** to avoid duplicates
2. **Describe the use case** and problem being solved
3. **Provide examples** of how it would work
4. **Consider implementation** complexity and maintenance

## Recognition

Contributors will be:
- Listed in package.json contributors field
- Mentioned in release notes
- Added to a contributors file (if created)

Thank you for contributing to Grok CLI! 🚀
