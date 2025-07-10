import { GrokAPIClient } from '@grok-cli/core';
import { ConfigManager, logger } from '@grok-cli/shared';
import inquirer from 'inquirer';
import ora from 'ora';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';

interface CreateOptions {
  type?: string;
  name?: string;
  description?: string;
  framework?: string;
  language?: string;
  model?: string;
}

const PROJECT_TEMPLATES = {
  'web-app': {
    name: 'Web Application',
    description: 'Full-stack web application with frontend and backend',
    frameworks: ['react', 'vue', 'svelte', 'vanilla'],
    languages: ['typescript', 'javascript']
  },
  'api': {
    name: 'REST API',
    description: 'Backend API server with database integration',
    frameworks: ['express', 'fastify', 'koa', 'nestjs'],
    languages: ['typescript', 'javascript', 'python']
  },
  'cli': {
    name: 'Command Line Tool',
    description: 'CLI application with command parsing and utilities',
    frameworks: ['commander', 'yargs', 'oclif'],
    languages: ['typescript', 'javascript', 'python', 'go']
  },
  'library': {
    name: 'Library/Package',
    description: 'Reusable library or npm package',
    frameworks: ['typescript', 'rollup', 'webpack'],
    languages: ['typescript', 'javascript']
  },
  'mobile': {
    name: 'Mobile App',
    description: 'Cross-platform mobile application',
    frameworks: ['react-native', 'expo', 'flutter'],
    languages: ['typescript', 'javascript', 'dart']
  },
  'desktop': {
    name: 'Desktop App',
    description: 'Cross-platform desktop application',
    frameworks: ['electron', 'tauri', 'flutter'],
    languages: ['typescript', 'javascript', 'rust', 'dart']
  },
  'game': {
    name: 'Game',
    description: 'Game project with basic structure',
    frameworks: ['phaser', 'unity', 'godot'],
    languages: ['typescript', 'javascript', 'csharp', 'gdscript']
  },
  'custom': {
    name: 'Custom Project',
    description: 'Custom project based on your description',
    frameworks: [],
    languages: []
  }
};

export async function createCommand(projectName?: string, options: CreateOptions = {}) {
  const configManager = ConfigManager.getInstance();
  await configManager.load();
  const config = configManager.getAll();

  if (!config.apiKey) {
    logger.error('API key not configured. Run "grok config set-key" to set it.');
    return;
  }

  console.log();
  console.log(chalk.bold.cyan('Grok Project Creator'));
  console.log(chalk.gray('Create a new project from scratch with AI assistance'));
  console.log();

  try {
    // Get project details through interactive prompts
    const projectDetails = await getProjectDetails(projectName, options);
    
    // Create project directory
    const projectPath = path.resolve(process.cwd(), projectDetails.name);
    await createProjectDirectory(projectPath);
    
    // Generate project structure using Grok
    await generateProject(config, projectDetails, projectPath);
    
    console.log();
    console.log(chalk.green('Project created successfully!'));
    console.log();
    console.log(chalk.cyan('Next steps:'));
    console.log(chalk.gray(`  cd ${projectDetails.name}`));
    console.log(chalk.gray('  npm install'));
    console.log(chalk.gray('  npm start'));
    console.log();
    
  } catch (error: any) {
    logger.error(`Failed to create project: ${error.message}`);
  }
}

async function getProjectDetails(projectName?: string, options: CreateOptions = {}) {
  const questions: any[] = [];

  // Project name
  if (!projectName) {
    questions.push({
      type: 'input',
      name: 'name',
      message: 'Project name:',
      validate: (input: string) => {
        if (!input.trim()) return 'Project name is required';
        if (!/^[a-z0-9-_]+$/i.test(input)) return 'Project name should only contain letters, numbers, hyphens, and underscores';
        return true;
      }
    });
  }

  // Project type
  if (!options.type) {
    questions.push({
      type: 'list',
      name: 'type',
      message: 'What type of project do you want to create?',
      choices: Object.entries(PROJECT_TEMPLATES).map(([key, template]) => ({
        name: `${template.name} - ${template.description}`,
        value: key
      }))
    });
  }

  // Get initial answers
  const initialAnswers = await inquirer.prompt(questions);
  const projectType = options.type || initialAnswers.type;
  const name = projectName || initialAnswers.name;

  // Additional questions based on project type
  const additionalQuestions: any[] = [];

  if (projectType !== 'custom') {
    const template = PROJECT_TEMPLATES[projectType as keyof typeof PROJECT_TEMPLATES];
    
    // Framework selection
    if (template.frameworks.length > 1 && !options.framework) {
      additionalQuestions.push({
        type: 'list',
        name: 'framework',
        message: 'Choose a framework:',
        choices: template.frameworks
      });
    }

    // Language selection
    if (template.languages.length > 1 && !options.language) {
      additionalQuestions.push({
        type: 'list',
        name: 'language',
        message: 'Choose a programming language:',
        choices: template.languages
      });
    }
  }

  // Project description
  if (!options.description) {
    additionalQuestions.push({
      type: 'input',
      name: 'description',
      message: projectType === 'custom' 
        ? 'Describe the project you want to create:'
        : 'Project description (optional):',
      validate: (input: string) => {
        if (projectType === 'custom' && !input.trim()) {
          return 'Description is required for custom projects';
        }
        return true;
      }
    });
  }

  const additionalAnswers = await inquirer.prompt(additionalQuestions);

  return {
    name,
    type: projectType,
    framework: options.framework || additionalAnswers.framework || PROJECT_TEMPLATES[projectType as keyof typeof PROJECT_TEMPLATES]?.frameworks[0],
    language: options.language || additionalAnswers.language || PROJECT_TEMPLATES[projectType as keyof typeof PROJECT_TEMPLATES]?.languages[0],
    description: options.description || additionalAnswers.description || PROJECT_TEMPLATES[projectType as keyof typeof PROJECT_TEMPLATES]?.description,
    model: options.model // Pass through the model option
  };
}

async function createProjectDirectory(projectPath: string) {
  try {
    await fs.access(projectPath);
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: `Directory "${path.basename(projectPath)}" already exists. Overwrite?`,
        default: false
      }
    ]);
    
    if (!overwrite) {
      throw new Error('Project creation cancelled');
    }
    
    await fs.rm(projectPath, { recursive: true, force: true });
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
  
  await fs.mkdir(projectPath, { recursive: true });
}

async function generateProject(config: any, projectDetails: any, projectPath: string) {
  const spinner = ora('Fetching available models...').start();
  
  try {
    const client = new GrokAPIClient({ apiKey: config.apiKey });
    
    // Fetch available models
    const models = await client.models();
    
    let selectedModel;
    
    if (projectDetails.model) {
      // Use specified model if provided
      selectedModel = models.find(m => m.id === projectDetails.model);
      if (!selectedModel) {
        spinner.stop();
        console.log(chalk.yellow(`Model '${projectDetails.model}' not found.`));
        console.log(chalk.gray('Available models: ') + models.map(m => m.id).join(', '));
        
        // Ask user to select from available models
        const { chosenModel } = await inquirer.prompt([
          {
            type: 'list',
            name: 'chosenModel',
            message: 'Choose a model for project generation:',
            choices: models.map(m => ({
              name: `${m.id} ${getModelDescription(m.id)}`,
              value: m.id
            }))
          }
        ]);
        selectedModel = models.find(m => m.id === chosenModel);
      }
    } else {
      // Let user choose the model
      spinner.stop();
      console.log();
      console.log(chalk.cyan('Choose the model for project generation:'));
      console.log(chalk.gray('Different models offer different trade-offs between speed and quality.'));
      console.log();
      
      const { chosenModel } = await inquirer.prompt([
        {
          type: 'list',
          name: 'chosenModel',
          message: 'Select model:',
          choices: models.map(m => ({
            name: `${m.id} ${getModelDescription(m.id)}`,
            value: m.id
          })),
          default: getDefaultModel(models)
        }
      ]);
      selectedModel = models.find(m => m.id === chosenModel);
    }
    
    if (!selectedModel) {
      throw new Error('No valid model selected');
    }
    
    console.log();
    spinner.start(`Generating project with ${selectedModel.id}...`);
    
    const prompt = buildProjectPrompt(projectDetails);
    
    const response = await client.chat([
      { role: 'user', content: prompt }
    ], { 
      model: selectedModel.id 
    });
    
    spinner.text = 'Creating files...';
    
    // Parse the response and create files
    await createProjectFiles(response.choices[0].message.content, projectPath, projectDetails);
    
    spinner.succeed('Project structure generated successfully!');
    
  } catch (error) {
    spinner.fail('Failed to generate project structure');
    throw error;
  }
}

function getModelDescription(modelId: string): string {
  const descriptions: { [key: string]: string } = {
    'grok-4-0709': '(Highest quality, slower)',
    'grok-3': '(High quality, balanced speed)',
    'grok-3-fast': '(Good quality, fast)',
    'grok-3-mini': '(Compact, efficient)',
    'grok-3-mini-fast': '(Fastest, good for simple projects)',
    'grok-2-1212': '(Stable, reliable)',
    'grok-2-vision-1212': '(Vision support)',
    'grok-2-image-1212': '(Image processing)'
  };
  
  return descriptions[modelId] || '(General purpose)';
}

function getDefaultModel(models: any[]): string {
  // Default to grok-3 if available, otherwise grok-3-fast, then first available
  return models.find(m => m.id === 'grok-3')?.id ||
         models.find(m => m.id === 'grok-3-fast')?.id ||
         models[0]?.id;
}

function buildProjectPrompt(details: any): string {
  return `Create a complete, production-ready ${details.type} project with the following specifications:

**Project Details:**
- Name: ${details.name}
- Type: ${details.type}
- Framework: ${details.framework || 'N/A'}
- Language: ${details.language || 'JavaScript'}
- Description: ${details.description}

**Requirements:**
1. Generate a complete project structure with all necessary files
2. Include package.json with appropriate dependencies
3. Add a comprehensive README.md with setup instructions
4. Include proper configuration files (tsconfig.json, .gitignore, etc.)
5. Create example code that demonstrates the project's functionality
6. Add scripts for development, build, and deployment
7. Include basic tests if applicable
8. Follow best practices for the chosen technology stack

**Output Format:**
For each file, use this exact format:
\`\`\`filename:path/to/file.ext
[file content here]
\`\`\`

Start with the project structure overview, then provide all files with their complete content.
Make sure the project is immediately runnable after creation.

Generate the project now:`;
}

async function createProjectFiles(response: string, projectPath: string, projectDetails: any) {
  // Parse the response to extract files
  const fileRegex = /```filename:(.+?)\n([\s\S]*?)```/g;
  let match;
  const files: { path: string; content: string }[] = [];
  
  while ((match = fileRegex.exec(response)) !== null) {
    files.push({
      path: match[1].trim(),
      content: match[2]
    });
  }
  
  if (files.length === 0) {
    // Fallback: try to parse alternative formats
    const altRegex = /```([^\n]*)\n([\s\S]*?)```/g;
    let altMatch;
    
    while ((altMatch = altRegex.exec(response)) !== null) {
      const firstLine = altMatch[1].trim();
      
      // Skip code blocks that are just language identifiers
      if (!firstLine || ['javascript', 'typescript', 'json', 'bash', 'shell'].includes(firstLine.toLowerCase())) {
        continue;
      }
      
      // Try to extract filename from the content or context
      files.push({
        path: firstLine.includes('.') ? firstLine : `${firstLine}.js`,
        content: altMatch[2]
      });
    }
  }
  
  // Create files
  for (const file of files) {
    const filePath = path.join(projectPath, file.path);
    const fileDir = path.dirname(filePath);
    
    // Create directory if it doesn't exist
    await fs.mkdir(fileDir, { recursive: true });
    
    // Write file content
    await fs.writeFile(filePath, file.content.trim(), 'utf8');
  }
  
  // If no files were parsed, create a basic structure
  if (files.length === 0) {
    await createFallbackStructure(projectPath, projectDetails, response);
  }
}

async function createFallbackStructure(projectPath: string, projectDetails: any, aiResponse: string) {
  // Create basic package.json
  const packageJson = {
    name: projectDetails.name,
    version: "1.0.0",
    description: projectDetails.description,
    main: "index.js",
    scripts: {
      start: "node index.js",
      dev: "node index.js",
      test: "echo \"Error: no test specified\" && exit 1"
    },
    keywords: [],
    author: "",
    license: "MIT"
  };
  
  await fs.writeFile(
    path.join(projectPath, 'package.json'),
    JSON.stringify(packageJson, null, 2),
    'utf8'
  );
  
  // Create basic index file
  const indexContent = `// ${projectDetails.name}
// ${projectDetails.description}

console.log('Hello from ${projectDetails.name}!');

// Generated with Grok CLI
// AI Response was:
/*
${aiResponse}
*/
`;
  
  await fs.writeFile(
    path.join(projectPath, 'index.js'),
    indexContent,
    'utf8'
  );
  
  // Create README
  const readmeContent = `# ${projectDetails.name}

${projectDetails.description}

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`bash
npm start
\`\`\`

## Generated with Grok CLI

This project was generated using the Grok CLI project creator.
`;
  
  await fs.writeFile(
    path.join(projectPath, 'README.md'),
    readmeContent,
    'utf8'
  );
}
