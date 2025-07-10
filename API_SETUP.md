# API Key Setup Guide

## Getting Your xAI API Key

1. **Visit the xAI Console**: Go to [https://console.x.ai/](https://console.x.ai/)

2. **Sign In**: Log in to your xAI account (create one if you don't have it)

3. **Navigate to API Keys**: Look for "API Keys" or "API Access" in the menu

4. **Create New Key**: Click "Create API Key" or "New API Key"

5. **Copy Your Key**: Save the API key securely - you won't be able to see it again

## Setting Up the CLI

### Method 1: During First Run
```bash
grok
# Follow the setup wizard and paste your API key when prompted
```

### Method 2: Using Configuration Command
```bash
grok-cli config set-key
# Enter your API key when prompted
```

### Method 3: Environment Variable
```bash
export GROK_API_KEY="your-api-key-here"
grok
```

## Troubleshooting

### Common Issues

**403 Forbidden Error**: Usually means insufficient credits or billing not set up
- Check your xAI console for billing settings
- Add credits or payment method to your account

**401 Unauthorized Error**: Invalid API key
- Double-check your API key is correct
- Make sure you're using an xAI API key, not another service

**Network Errors**: Connection issues
- Check your internet connection
- Verify you can access https://api.x.ai/

### Testing Your Setup

Once configured, test your setup:
```bash
grok
# Try asking a simple question like "Hello, can you help me?"
```

## Security Notes

- Never commit API keys to version control
- The CLI stores your key locally in `~/.grok-cli/config.json`
- You can remove the key anytime with: `grok-cli config remove-key`
