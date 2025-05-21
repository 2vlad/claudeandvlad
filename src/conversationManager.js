/**
 * Manages conversations for the Claude Telegram Bot
 */

const config = require('./config');

// Store user conversations
const conversations = new Map();

// Maximum conversation history to maintain (in messages)
const MAX_CONVERSATION_HISTORY = config.conversation.maxHistory;

/**
 * Add a message to the conversation history
 * @param {string} chatId - The chat ID
 * @param {string} role - The role ('user' or 'assistant')
 * @param {string} content - The message content
 * @param {Object} mediaInfo - Optional media info (for images, documents)
 */
const addMessage = (chatId, role, content, mediaInfo = null) => {
  if (!conversations.has(chatId)) {
    conversations.set(chatId, []);
  }

  const history = conversations.get(chatId);
  const message = { role, content };
  
  // Add media info if available
  if (mediaInfo) {
    message.mediaInfo = mediaInfo;
  }
  
  history.push(message);

  // Maintain history limit
  if (history.length > MAX_CONVERSATION_HISTORY * 2) {
    const historyLength = history.length;
    conversations.set(
      chatId, 
      history.slice(historyLength - MAX_CONVERSATION_HISTORY * 2)
    );
  }
};

/**
 * Get the conversation history for a chat
 * @param {string} chatId - The chat ID
 * @returns {Array} The conversation history
 */
const getConversation = (chatId) => {
  if (!conversations.has(chatId)) {
    conversations.set(chatId, []);
  }
  return conversations.get(chatId);
};

/**
 * Clear the conversation history for a chat
 * @param {string} chatId - The chat ID
 */
const clearConversation = (chatId) => {
  conversations.delete(chatId);
};

/**
 * Get formatted messages for Anthropic API
 * @param {string} chatId - The chat ID
 * @returns {Array} Formatted messages for the Anthropic API
 */
const getFormattedMessages = (chatId) => {
  const rawMessages = getConversation(chatId);
  const formattedMessages = rawMessages.map(msg => {
    // Just pass the role and content for API compatibility
    return {
      role: msg.role,
      content: msg.content
    };
  });
  
  return [
    {
      role: 'system',
      content: config.conversation.systemPrompt
    },
    ...formattedMessages
  ];
};

/**
 * Get a summary of the conversation history
 * @param {string} chatId - The chat ID
 * @returns {string} Summary of the conversation
 */
const getConversationSummary = (chatId) => {
  if (!conversations.has(chatId) || conversations.get(chatId).length === 0) {
    return "No conversation history yet.";
  }

  const history = conversations.get(chatId);
  let summary = "Conversation History:\n\n";
  
  // Get the last 5 message pairs (or fewer if not available)
  const startIndex = Math.max(0, history.length - 10);
  const recentHistory = history.slice(startIndex);
  
  recentHistory.forEach((message, index) => {
    const roleDisplay = message.role === 'user' ? '🧑 You' : '🤖 Claude';
    
    // Check if the message has media info
    const hasMedia = message.mediaInfo ? true : false;
    
    // Format differently based on content type
    let messageText = message.content;
    if (message.content.length > 100) {
      messageText = `${message.content.substring(0, 100)}...`;
    }
    
    // Add media indicator if applicable
    const mediaIndicator = hasMedia ? ' [Media]' : '';
    
    summary += `${index + 1 + startIndex}. ${roleDisplay}${mediaIndicator}: ${messageText}\n\n`;
  });
  
  return summary;
};

module.exports = {
  addMessage,
  getConversation,
  clearConversation,
  getFormattedMessages,
  getConversationSummary
}; 