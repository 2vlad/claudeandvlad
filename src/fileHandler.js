const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const config = require('./config');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
fs.ensureDirSync(uploadsDir);

/**
 * Download a file from Telegram and save it locally
 * @param {Object} bot - Telegram bot instance
 * @param {string} fileId - Telegram file ID
 * @param {string} fileName - Name to save the file as
 * @returns {Promise<Object>} - Object with file path and info
 */
async function downloadTelegramFile(bot, fileId, fileName) {
  try {
    // Get file path from Telegram
    const fileInfo = await bot.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${config.telegram.token}/${fileInfo.file_path}`;
    
    // Create a unique filename
    const timestamp = Date.now();
    const fileExt = path.extname(fileInfo.file_path);
    const safeFileName = `${fileName.replace(/[^a-z0-9]/gi, '_')}_${timestamp}${fileExt}`;
    const localFilePath = path.join(uploadsDir, safeFileName);
    
    // Download file
    const response = await axios({
      method: 'GET',
      url: fileUrl,
      responseType: 'stream'
    });
    
    // Save file
    const writer = fs.createWriteStream(localFilePath);
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        resolve({
          filePath: localFilePath,
          fileName: safeFileName,
          fileInfo
        });
      });
      writer.on('error', reject);
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
}

/**
 * Get a URL that can be used to access the file
 * @param {string} fileName - File name
 * @returns {string} - URL to access the file
 */
function getFileUrl(fileName) {
  // If you have a public URL where files are accessible, use that
  // For local testing, just return the file path
  return `${config.server.url}/uploads/${fileName}`;
}

module.exports = {
  downloadTelegramFile,
  getFileUrl,
  uploadsDir
}; 