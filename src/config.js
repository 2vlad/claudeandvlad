/**
 * Configuration for the Claude Telegram Bot
 */

require('dotenv').config();

// Validate required environment variables
const requiredEnvVars = [
  'TELEGRAM_BOT_TOKEN',
  'ANTHROPIC_API_KEY',
  'ANTHROPIC_MODEL'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

module.exports = {
  // Telegram Bot settings
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN,
    // Use webhooks in production, polling in development
    useWebhook: process.env.NODE_ENV === 'production',
    // Webhook settings (for production)
    webhook: {
      url: `${process.env.SERVER_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}`,
      port: process.env.PORT || 8080
    },
    // Polling settings (for development)
    polling: {
      interval: 300,
      params: {
        timeout: 10
      },
      autoStart: !process.env.NODE_ENV || process.env.NODE_ENV !== 'production'
    }
  },
  
  // Anthropic API settings
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.ANTHROPIC_MODEL,
    maxTokens: 1000
  },
  
  // Server settings
  server: {
    url: process.env.SERVER_URL || 'http://localhost:3000',
    port: process.env.PORT || 3000
  },
  
  // Conversation settings
  conversation: {
    maxHistory: 10, // Maximum number of conversation pairs to keep
    systemPrompt: 'You are Claude, an AI assistant by Anthropic, helping via a Telegram bot. Be helpful, harmless, and honest. Keep responses concise and to the point, suitable for a messaging platform.'
  }
}; 