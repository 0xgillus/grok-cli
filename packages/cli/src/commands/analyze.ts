import { FileProcessor, ContextManager, GrokAPIClient } from '@grok-cli/core';
import { ConfigManager, logger } from '@grok-cli/shared';
import ora from 'ora';

interface AnalyzeOptions {
  recursive?: boolean;
  extensions?: string;
}

export async function analyzeCommand(path: string, options: AnalyzeOptions = {}) {
  const configManager = ConfigManager.getInstance();
  const config = configManager.getAll();

  if (!config.apiKey) {
    logger.error('API key not configured. Run "grok config set-key" to set it.');
    return;
  }

  const spinner = ora('Analyzing files...').start();

  try {
    const processor = new FileProcessor();
    const extensions = options.extensions ? options.extensions.split(',').map(ext => ext.trim()) : undefined;
    
    const files = await processor.getRelevantFiles(path, extensions);
    
    if (files.length === 0) {
      spinner.stop();
      logger.warn('No relevant files found.');
      return;
    }

    spinner.text = `Found ${files.length} files. Preparing analysis...`;

    const contextManager = new ContextManager();
    
    // Add files to context
    for (const file of files) {
      contextManager.addFile(file.path, file.content);
    }

    const analysisPrompt = `Please analyze the following codebase and provide insights about:

1. **Architecture & Structure**: Overall project organization and patterns
2. **Code Quality**: Areas that could be improved
3. **Dependencies**: Key libraries and frameworks used
4. **Potential Issues**: Bugs, security concerns, or technical debt
5. **Suggestions**: Recommendations for improvement

Focus on providing actionable insights.`;

    contextManager.addMessage({ role: 'user', content: analysisPrompt });

    spinner.text = 'Getting analysis from Grok...';

    const client = new GrokAPIClient({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
    });

    const messages = contextManager.getMessages();
    const response = await client.chat(messages, {
      model: config.defaultModel || 'grok-beta',
      temperature: 0.3, // Lower temperature for more focused analysis
    });

    spinner.stop();

    console.log('\n' + '='.repeat(60));
    console.log('CODEBASE ANALYSIS REPORT');
    console.log('='.repeat(60));
    console.log(`Path: ${path}`);
    console.log(`📄 Files analyzed: ${files.length}`);
    console.log(`🔤 Total tokens: ${contextManager.getTokenCount()}`);
    console.log('='.repeat(60));
    console.log();
    console.log(response.choices[0].message.content);
    console.log();
    console.log('='.repeat(60));
    
    if (response.usage) {
      logger.info(`Analysis complete. Tokens used: ${response.usage.totalTokens}`);
    }

  } catch (error) {
    spinner.stop();
    logger.error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
