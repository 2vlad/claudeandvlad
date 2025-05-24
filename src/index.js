const config = require('./config');
const TelegramBot = require('node-telegram-bot-api');
const { Anthropic } = require('@anthropic-ai/sdk');
const { logError, getUserErrorMessage } = require('./errorHandler');
const conversationManager = require('./conversationManager');
const fileHandler = require('./fileHandler');
const express = require('express');
const path = require('path');

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: config.anthropic.apiKey,
});

// Initialize Express server for file access
const app = express();
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Add a healthcheck endpoint for Railway
app.get('/', (req, res) => {
  res.status(200).send('Claude Telegram Bot is running!');
});

app.listen(config.server.port, () => {
  console.log(`File server running on port ${config.server.port}`);
});

// Initialize Telegram Bot
const bot = new TelegramBot(config.telegram.token, { polling: config.telegram.polling });

// Store last uploaded file for each chat
const lastUploadedFiles = {};

// Helper function to create keyboard markup
const getCommandKeyboard = () => {
  return {
    reply_markup: {
      keyboard: [
        ['/clear', '/history', '/help']
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    }
  };
};

// Helper function to create analyze keyboard markup
const getAnalyzeKeyboard = () => {
  return {
    reply_markup: {
      keyboard: [
        ['/analyze', '/clear', '/help']
      ],
      resize_keyboard: true,
      one_time_keyboard: false
    }
  };
};

// Welcome message when starting the bot
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    'Hello! I am your Claude AI assistant bot. How can I help you today? You can also send me images and files!',
    getCommandKeyboard()
  );
});

// Clear conversation history
bot.onText(/\/clear/, (msg) => {
  const chatId = msg.chat.id;
  conversationManager.clearConversation(chatId);
  bot.sendMessage(chatId, 'Conversation history cleared!', getCommandKeyboard());
});

// View conversation history
bot.onText(/\/history/, (msg) => {
  const chatId = msg.chat.id;
  const summary = conversationManager.getConversationSummary(chatId);
  bot.sendMessage(chatId, summary, getCommandKeyboard());
});

// Help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    'Available commands:\n' +
    '/start - Start the bot\n' +
    '/clear - Clear conversation history\n' +
    '/history - View recent conversation\n' +
    '/analyze - Analyze the last uploaded file\n' +
    '/help - Show this help message\n\n' +
    'Simply send a message to chat with Claude AI.\n' +
    'You can also send images and files that I can see and process.',
    getCommandKeyboard()
  );
});

// Analyze last uploaded file
bot.onText(/\/analyze/, async (msg) => {
  const chatId = msg.chat.id;
  
  // Check if there's a file to analyze
  if (!lastUploadedFiles[chatId]) {
    bot.sendMessage(chatId, 'No file to analyze. Please upload a file first.', getCommandKeyboard());
    return;
  }
  
  try {
    bot.sendChatAction(chatId, 'typing');
    
    const fileData = lastUploadedFiles[chatId];
    
    // Read file content
    const fileContent = await fileHandler.readFileContent(fileData.filePath);
    
    // Create a prompt for Claude
    const analyzePrompt = `Please analyze the following file content:\n\n${fileContent}\n\nProvide a summary and any insights about this content.`;
    
    // Add message to conversation
    conversationManager.addMessage(chatId, 'user', analyzePrompt);
    
    // Get formatted messages for Anthropic API
    const formattedMessages = conversationManager.getFormattedMessages(chatId);
    
    // Extract system message
    const systemMessage = formattedMessages.find(msg => msg.role === 'system');
    const conversationMessages = formattedMessages.filter(msg => msg.role !== 'system');
    
    // Send message to user that analysis is in progress
    bot.sendMessage(chatId, `Analyzing file: ${fileData.fileName}...`, getCommandKeyboard());
    
    // Call Anthropic API
    const response = await anthropic.messages.create({
      system: systemMessage ? systemMessage.content : undefined,
      messages: conversationMessages,
      model: config.anthropic.model,
      max_tokens: config.anthropic.maxTokens,
      temperature: 0.7,
    });

    // Extract response text
    const assistantResponse = response.content[0].text;

    // Add assistant's response to conversation history
    conversationManager.addMessage(chatId, 'assistant', assistantResponse);

    // Send the response to the user
    bot.sendMessage(chatId, assistantResponse, getCommandKeyboard());
  } catch (error) {
    logError(error, { chatId, context: 'File analysis' });
    bot.sendMessage(chatId, "Sorry, I couldn't analyze this file. " + getUserErrorMessage(error), getCommandKeyboard());
  }
});

// Handle photo uploads
bot.on('photo', async (msg) => {
  const chatId = msg.chat.id;
  try {
    bot.sendChatAction(chatId, 'typing');
    
    // Get the best quality photo (last item in array)
    const photo = msg.photo[msg.photo.length - 1];
    const fileId = photo.file_id;
    const caption = msg.caption || 'Image';
    
    // Download the photo
    const fileData = await fileHandler.downloadTelegramFile(bot, fileId, `photo_${chatId}`);
    const fileUrl = fileHandler.getFileUrl(fileData.fileName);
    
    // Create a user message with the image information
    const userMessage = `[${caption}] - Image uploaded: ${fileUrl}`;
    
    // Add message to conversation
    conversationManager.addMessage(chatId, 'user', userMessage);
    
    // Send confirmation
    bot.sendMessage(chatId, `I've received your image${msg.caption ? ` with caption: "${msg.caption}"` : ''}.`, getCommandKeyboard());
  } catch (error) {
    logError(error, { chatId, context: 'Photo upload' });
    bot.sendMessage(chatId, "Sorry, I couldn't process this image. " + getUserErrorMessage(error), getCommandKeyboard());
  }
});

// Handle document uploads
bot.on('document', async (msg) => {
  const chatId = msg.chat.id;
  try {
    bot.sendChatAction(chatId, 'typing');
    
    const document = msg.document;
    const fileId = document.file_id;
    const fileName = document.file_name || 'document';
    const caption = msg.caption || 'Document';
    
    // Download the document
    const fileData = await fileHandler.downloadTelegramFile(bot, fileId, fileName);
    const fileUrl = fileHandler.getFileUrl(fileData.fileName);
    
    // Store the file data for later analysis
    lastUploadedFiles[chatId] = {
      fileName: fileName,
      filePath: fileData.filePath,
      fileUrl: fileUrl,
      mimeType: document.mime_type
    };
    
    // Create a user message with the document information
    const userMessage = `[${caption}] - File uploaded: ${fileUrl} (name: ${fileName}, type: ${document.mime_type})`;
    
    // Add message to conversation
    conversationManager.addMessage(chatId, 'user', userMessage);
    
    // Send confirmation with analyze option
    bot.sendMessage(
      chatId, 
      `I've received your file: "${fileName}"${msg.caption ? ` with caption: "${msg.caption}"` : ''}. 
Use /analyze to analyze the content of this file.`, 
      getAnalyzeKeyboard()
    );
  } catch (error) {
    logError(error, { chatId, context: 'Document upload' });
    bot.sendMessage(chatId, "Sorry, I couldn't process this file. " + getUserErrorMessage(error), getCommandKeyboard());
  }
});

// Handle all other messages
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userInput = msg.text;

  // Ignore commands and non-text messages
  if (!userInput || userInput.startsWith('/') || msg.photo || msg.document) return;

  try {
    // Send "typing" action
    bot.sendChatAction(chatId, 'typing');

    // Add user message to history
    conversationManager.addMessage(chatId, 'user', userInput);
    
    // Get formatted messages for Anthropic API
    const formattedMessages = conversationManager.getFormattedMessages(chatId);
    
    // Extract system message
    const systemMessage = formattedMessages.find(msg => msg.role === 'system');
    const conversationMessages = formattedMessages.filter(msg => msg.role !== 'system');
    
    // Log the request for debugging
    console.log('Sending request to Anthropic API with model:', config.anthropic.model);

    // Call Anthropic API
    const response = await anthropic.messages.create({
      system: systemMessage ? systemMessage.content : undefined,
      messages: conversationMessages,
      model: config.anthropic.model,
      max_tokens: config.anthropic.maxTokens,
      temperature: 0.7,
    });

    // Extract response text
    const assistantResponse = response.content[0].text;

    // Add assistant's response to conversation history
    conversationManager.addMessage(chatId, 'assistant', assistantResponse);

    // Send the response to the user
    bot.sendMessage(chatId, assistantResponse, getCommandKeyboard());
  } catch (error) {
    // Log the full error details
    logError(error, { chatId, userInput });
    
    // Get more specific error message if available
    let errorMessage = getUserErrorMessage(error);
    
    if (error instanceof Anthropic.APIError) {
      console.error(`API Error: ${error.status} - ${error.message}`);
      if (error.status === 401) {
        errorMessage = "Authentication error. Please check the API key.";
      } else if (error.status === 403) {
        errorMessage = "Access denied. Your API key may not have permission to use this model or the model ID is incorrect.";
      } else if (error.status === 429) {
        errorMessage = "Rate limit exceeded. Please try again in a few moments.";
      }
    }
    
    // Send a user-friendly error message
    bot.sendMessage(chatId, errorMessage, getCommandKeyboard());
  }
});

// Handle errors in the bot itself
bot.on('polling_error', (error) => {
  logError(error, { context: 'Telegram polling error' });
});

console.log('Bot is running...'); 