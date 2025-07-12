import { Message, GrokResponse, GrokModel } from '@grok-cli/shared';

export class MockGrokClient {
  private delay = (ms: number) =>
    new Promise(resolve => setTimeout(resolve, ms));

  async chat(messages: Message[]): Promise<GrokResponse> {
    // Simulate API delay
    await this.delay(1000 + Math.random() * 1000);

    const lastMessage = messages[messages.length - 1];
    const response = this.generateMockResponse(lastMessage.content);

    return {
      id: 'mock_' + Date.now(),
      choices: [
        {
          message: {
            role: 'assistant',
            content: response,
          },
          finishReason: 'stop',
        },
      ],
      usage: {
        promptTokens: Math.floor(lastMessage.content.length / 4),
        completionTokens: Math.floor(response.length / 4),
        totalTokens: Math.floor(
          (lastMessage.content.length + response.length) / 4
        ),
      },
    };
  }

  async *stream(messages: Message[]): AsyncGenerator<string> {
    await this.delay(500);

    const lastMessage = messages[messages.length - 1];
    const response = this.generateMockResponse(lastMessage.content);
    const words = response.split(' ');

    for (const word of words) {
      yield word + ' ';
      await this.delay(50 + Math.random() * 100);
    }
  }

  async models(): Promise<GrokModel[]> {
    await this.delay(500);

    return [
      {
        id: 'grok-beta',
        name: 'Grok Beta',
        description: 'Latest Grok model (Mock)',
        contextLength: 32768,
      },
      {
        id: 'grok-2',
        name: 'Grok 2',
        description: 'Advanced Grok model (Mock)',
        contextLength: 65536,
      },
      {
        id: 'grok-1',
        name: 'Grok 1',
        description: 'Original Grok model (Mock)',
        contextLength: 16384,
      },
    ];
  }

  private generateMockResponse(input: string): string {
    const lowerInput = input.toLowerCase();

    // Programming related responses
    if (
      lowerInput.includes('typescript') ||
      lowerInput.includes('javascript')
    ) {
      return `TypeScript is a powerful superset of JavaScript that adds static type checking. Here's what makes it great:

**Key Benefits:**
- **Type Safety**: Catch errors at compile-time
- **Better IDE Support**: Excellent autocomplete and refactoring
- **Self-Documenting**: Types serve as inline documentation
- **Tooling**: Amazing development experience

**Example:**
\`\`\`typescript
interface User {
  id: number;
  name: string;
  email: string;
}

function greetUser(user: User): string {
  return \`Hello, \${user.name}!\`;
}
\`\`\`

Would you like me to explain any specific TypeScript concepts?`;
    }

    if (lowerInput.includes('react') || lowerInput.includes('component')) {
      return `Here's a modern React component example with TypeScript:

\`\`\`tsx
import React, { useState } from 'react';

interface ButtonProps {
  variant: 'primary' | 'secondary';
  onClick: () => void;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ variant, onClick, children }) => {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <button
      className={variant === 'primary' ? 'btn-primary' : 'btn-secondary'}
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      style={{ transform: isPressed ? 'scale(0.98)' : 'scale(1)' }}
    >
      {children}
    </button>
  );
};

export default Button;
\`\`\`

This component demonstrates modern React patterns with TypeScript!`;
    }

    if (lowerInput.includes('code') || lowerInput.includes('analyze')) {
      return `I can help you analyze code! Here's what I can do:

**Code Analysis Capabilities:**
- Architecture review and suggestions
- Code quality assessment
- Performance optimization tips
- Security vulnerability detection
- Best practices recommendations

**Supported Languages:**
- JavaScript/TypeScript
- Python
- Java
- Go
- Rust
- And many more!

**Tips for better analysis:**
- Include specific files with @path/to/file
- Ask about specific patterns or issues
- Request optimization suggestions

Try asking: "Analyze this function for performance issues" or "Review this code for best practices"`;
    }

    if (
      lowerInput.includes('hello') ||
      lowerInput.includes('hi') ||
      lowerInput.includes('hey')
    ) {
      return `Hello! Welcome to Grok CLI!

I'm here to help you with:
- **Code Analysis**: Review and improve your codebase
- **Programming Help**: Explain concepts and write code
- **Development**: Best practices and architecture advice
- **Debugging**: Help solve coding problems

**Quick Tips:**
- Ask specific questions for better results
- Include code snippets in your messages
- Use @path/to/file to reference files
- Type /help for more commands

What would you like to work on today?`;
    }

    if (lowerInput.includes('help')) {
      return `Here's how to get the most out of Grok CLI:

**Best Practices:**
- Be specific in your questions
- Provide context about your project
- Include relevant code snippets
- Mention your tech stack

**Example Questions:**
- "Explain this TypeScript error: [error message]"
- "How can I optimize this React component?"
- "Review this API design for best practices"
- "Generate a Node.js Express route for users"

🔧 **Commands:**
- \`/help\` - Show this help
- \`/clear\` - Clear conversation
- \`/models\` - Available models
- \`/config\` - Show settings

Ready to code? Ask me anything!`;
    }

    // Default response
    return `That's an interesting question! Based on your input about "${input.substring(0, 50)}${input.length > 50 ? '...' : ''}", here's my response:

I'm a mock version of Grok running in demo mode. In the real version, I would provide intelligent responses powered by xAI's Grok models.

**What I can help you with in demo mode:**
- Show you the beautiful CLI interface
- Demonstrate interactive chat features
- Test configuration and commands
- Experience the user interface

**To use the real Grok:**
1. Get an xAI API key from https://console.x.ai/
2. Run: \`grok-cli config set-key\`
3. Start chatting with the real Grok models!

Try asking about programming, code analysis, or development questions to see more realistic responses!`;
  }
}
