/**
 * Error handler for the Claude Telegram Bot
 */

const { Anthropic } = require('@anthropic-ai/sdk');

// Log errors to console with details
const logError = (error, context = {}) => {
  console.error('ERROR:', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  });
};

// Format user-facing error messages
const getUserErrorMessage = (error) => {
  // Anthropic API errors
  if (error instanceof Anthropic.APIError) {
    if (error.status === 401) {
      return 'Authentication error. Please check API keys.';
    } else if (error.status === 403) {
      return 'Access denied. Your API key may not have permission to use this model.';
    } else if (error.status === 429) {
      return 'Rate limit exceeded. Please try again in a few moments.';
    } else if (error.status >= 500) {
      return 'Service is temporarily unavailable. Please try again later.';
    } else if (error.status === 400) {
      return 'Invalid request. The bot encountered an error with your message.';
    }
  }
  
  // Network errors
  if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
    return 'Network error. Please check your connection and try again.';
  }
  
  // Default error message
  return 'Sorry, I encountered an error. Please try again later.';
};

module.exports = {
  logError,
  getUserErrorMessage
}; 