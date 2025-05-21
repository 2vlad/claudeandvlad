# Deploying Claude Telegram Bot to Render

This guide will walk you through deploying your Claude Telegram Bot to Render.com using the manual upload method.

## Prerequisites

- A Render.com account (free tier works fine)
- The ZIP file of your project (`claude-telegram-bot.zip`)
- Your Telegram Bot Token from BotFather
- Your Anthropic API Key

## Deployment Steps

### 1. Sign up or Log in to Render

Visit [render.com](https://render.com/) and sign up for an account if you don't have one.

### 2. Create a New Web Service

1. From your Render dashboard, click the **New +** button in the top right corner
2. Select **Web Service**
3. On the next page, choose **Upload Files** instead of connecting to a repository

### 3. Upload Your Project

1. Drag and drop your `claude-telegram-bot.zip` file or use the file selector
2. Click **Upload** and wait for the upload to complete

### 4. Configure Your Web Service

Once your files are uploaded, you'll need to configure your service with the following settings:

- **Name**: claude-telegram-bot (or any name you prefer)
- **Runtime**: Node
- **Build Command**: npm install
- **Start Command**: node src/index.js
- **Plan**: Free (or choose a paid plan if you need more resources)

### 5. Set Environment Variables

Click on the **Advanced** button before deployment and add the following environment variables:

- `TELEGRAM_BOT_TOKEN`: Your Telegram Bot Token
- `ANTHROPIC_API_KEY`: Your Anthropic API Key
- `ANTHROPIC_MODEL`: claude-3-7-sonnet-20240307
- `IS_HEROKU`: true (this enables the in-memory file storage system)

The `SERVER_URL` will be automatically set to your Render URL after deployment.

### 6. Deploy

Click the **Create Web Service** button to start the deployment process. Render will automatically build and deploy your application.

### 7. Verify Deployment

Once deployment is complete, Render will provide you with a URL for your application (something like `https://claude-telegram-bot.onrender.com`). 

Your bot should now be up and running! You can test it by sending a message to your Telegram bot.

## Troubleshooting

If you encounter any issues during deployment, check the logs in the Render dashboard for your web service. Common issues include:

- **Missing environment variables**: Double-check that all required environment variables are set
- **Build failures**: Make sure your package.json file includes all necessary dependencies
- **Timeout errors**: Free tier apps may sleep after periods of inactivity; they will wake up when receiving traffic

## Notes on File Uploads

Your bot is configured to handle file uploads using an in-memory storage system compatible with Render's ephemeral filesystem. Uploaded files will be available for the duration of the app's runtime but will be lost if the app restarts or sleeps.

For production use with many file uploads, consider using cloud storage like AWS S3 or Google Cloud Storage. 