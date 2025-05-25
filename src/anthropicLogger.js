/**
 * Logger for Anthropic API requests and responses
 */

const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log file path
const logFilePath = path.join(logsDir, 'anthropic_api.log');

/**
 * Log Anthropic API request
 * @param {Object} requestData - Request data
 */
const logRequest = (requestData) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    type: 'REQUEST',
    model: requestData.model,
    maxTokens: requestData.max_tokens,
    temperature: requestData.temperature,
    systemPrompt: requestData.system ? requestData.system.substring(0, 100) + (requestData.system.length > 100 ? '...' : '') : null,
    userInput: requestData.messages && requestData.messages.length > 0 ? 
      requestData.messages[requestData.messages.length - 1].content.substring(0, 100) + 
      (requestData.messages[requestData.messages.length - 1].content.length > 100 ? '...' : '') : null
  };

  // Log to console
  console.log('===== ANTHROPIC API REQUEST =====');
  console.log(JSON.stringify(logEntry, null, 2));
  console.log('================================');

  // Log to file
  fs.appendFileSync(logFilePath, JSON.stringify(logEntry) + '\n');
};

/**
 * Log Anthropic API response
 * @param {Object} responseData - Response data
 */
const logResponse = (responseData) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    type: 'RESPONSE',
    model: responseData.model,
    id: responseData.id,
    responseType: responseData.type,
    content: responseData.content && responseData.content.length > 0 ? 
      responseData.content[0].text.substring(0, 100) + 
      (responseData.content[0].text.length > 100 ? '...' : '') : null
  };

  // Log to console
  console.log('===== ANTHROPIC API RESPONSE =====');
  console.log(JSON.stringify(logEntry, null, 2));
  console.log('================================');

  // Log to file
  fs.appendFileSync(logFilePath, JSON.stringify(logEntry) + '\n');
};

/**
 * Create a wrapper for Anthropic API
 * @param {Object} anthropic - Original Anthropic API instance
 * @returns {Object} - Wrapped Anthropic API instance
 */
const createLoggedAnthropicClient = (anthropic) => {
  // Create a proxy for the messages.create method
  const originalCreate = anthropic.messages.create;
  
  anthropic.messages.create = async function(requestData) {
    // Log the request
    logRequest(requestData);
    
    try {
      // Call the original method
      const response = await originalCreate.call(this, requestData);
      
      // Log the response
      logResponse(response);
      
      return response;
    } catch (error) {
      // Log the error
      console.error('===== ANTHROPIC API ERROR =====');
      console.error(error);
      console.error('================================');
      
      // Re-throw the error
      throw error;
    }
  };
  
  return anthropic;
};

module.exports = {
  logRequest,
  logResponse,
  createLoggedAnthropicClient
};
