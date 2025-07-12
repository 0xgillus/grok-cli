# Grok CLI Examples

This directory contains examples of how to use the Grok CLI effectively.

## Basic Usage Examples

### 1. Simple Chat
```bash
# Start interactive mode
grok

# Send a single message
grok "Hello, how are you?"

# Use a specific model
grok "Explain quantum computing" --model grok-2

# Stream the response
grok "Write a Python function to calculate fibonacci" --stream
```

### 2. Configuration Examples
```bash
# Set up your API key
grok config set-key sk-your-api-key-here

# Set default model
grok config set-model grok-beta

# View current configuration
grok config show

# Reset all settings
grok config reset
```

### 3. Code Analysis Examples
```bash
# Analyze current directory
grok analyze .

# Analyze a specific directory
grok analyze ./src

# Analyze with file filtering
grok analyze . --extensions js,ts,jsx,tsx

# Recursive analysis of large projects
grok analyze . --recursive
```

## Advanced Use Cases

### 1. Code Review Workflow
```bash
# Analyze changes in current branch
git diff HEAD~1 > changes.diff
grok "Please review these code changes: $(cat changes.diff)"

# Get architecture suggestions
grok analyze ./src --extensions ts,js
```

### 2. Documentation Generation
```bash
# Generate README for a project
grok "Generate a comprehensive README.md for this project" \
  --model grok-2 > README.md

# Create API documentation
grok analyze ./api --extensions js,ts | \
  grok "Convert this analysis into API documentation"
```

### 3. Debugging Assistance
```bash
# Debug error logs
grok "Help me debug this error: $(cat error.log)"

# Code optimization suggestions
grok analyze ./performance-critical --extensions js,ts
```

### 4. Learning and Education
```bash
# Explain complex code
grok "Explain this codebase in simple terms for a beginner"

# Get coding best practices
grok "What are the best practices for this JavaScript codebase?" \
  --model grok-beta
```

## Environment Setup Examples

### 1. Using Environment Variables
```bash
# Set API key via environment
export GROK_API_KEY="your-api-key"
export GROK_BASE_URL="https://api.x.ai/v1"

# Use with custom settings
grok "Hello world"
```

### 2. Project-specific Configuration
```bash
# Create project-specific wrapper script
#!/bin/bash
# project-grok.sh
export GROK_API_KEY="project-specific-key"
grok "$@"

chmod +x project-grok.sh
./project-grok.sh "Analyze this project"
```

## Integration Examples

### 1. Git Hooks
```bash
# Pre-commit hook for code review
#!/bin/bash
# .git/hooks/pre-commit
if git diff --cached --name-only | grep -E '\.(js|ts|py)$' > /dev/null; then
  echo "Running Grok code analysis..."
  grok analyze --extensions js,ts,py . | head -20
fi
```

### 2. CI/CD Pipeline
```yaml
# .github/workflows/code-review.yml
name: AI Code Review
on: [pull_request]
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install Grok CLI
        run: npm install -g grok-cli
      - name: Analyze Code
        run: grok analyze . --extensions js,ts
        env:
          GROK_API_KEY: ${{ secrets.GROK_API_KEY }}
```

### 3. VS Code Integration
```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Grok: Analyze Current File",
      "type": "shell",
      "command": "grok",
      "args": ["analyze", "${file}"],
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "new"
      }
    }
  ]
}
```

## Scripting Examples

### 1. Batch Processing
```bash
#!/bin/bash
# analyze-all-projects.sh

for dir in */; do
  if [ -d "$dir/.git" ]; then
    echo "Analyzing $dir..."
    grok analyze "$dir" --recursive > "analysis-$dir.md"
  fi
done
```

### 2. Interactive Project Setup
```bash
#!/bin/bash
# smart-init.sh

echo "What type of project are you creating?"
read project_type

grok "Generate a project structure for a $project_type project" \
  --stream | tee project-plan.md

echo "Would you like me to create the files? (y/n)"
read create_files

if [ "$create_files" = "y" ]; then
  # Parse the output and create files
  echo "Creating project structure..."
fi
```

## Tips and Best Practices

### 1. Optimal Context Management
- Keep file analysis focused on relevant directories
- Use `--extensions` to filter file types
- Break large codebases into smaller chunks

### 2. Effective Prompting
- Be specific about what you want to analyze
- Provide context about your goals
- Use follow-up questions for clarification

### 3. Performance Optimization
- Use streaming for long responses
- Cache analysis results for large projects
- Limit file size with appropriate exclusions

### 4. Security Considerations
- Never include sensitive data in prompts
- Use environment variables for API keys
- Review generated code before execution

## Common Patterns

### 1. Code Quality Assessment
```bash
grok analyze . --extensions js,ts | \
  grok "Summarize the main code quality issues and provide a priority list"
```

### 2. Architecture Documentation
```bash
grok analyze ./src --recursive | \
  grok "Create an architecture diagram description from this analysis"
```

### 3. Migration Planning
```bash
grok "Plan a migration from JavaScript to TypeScript for this codebase" \
  --model grok-2
```

These examples should help you get the most out of the Grok CLI. For more advanced usage patterns, refer to the main documentation.
