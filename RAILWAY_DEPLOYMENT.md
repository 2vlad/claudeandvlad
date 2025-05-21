# Deploying Claude Telegram Bot to Railway

This guide will walk you through deploying your Claude Telegram Bot to Railway.app.

## Prerequisites

- A Railway.app account
- Git installed on your computer (optional for GitHub deployment method)

## Deployment Methods

You can deploy to Railway in two ways:
1. Directly from GitHub repository
2. Using Railway CLI from your local machine

### Method 1: Deploy from GitHub

1. Create a GitHub repository for your project if you don't have one
2. Push your code to the GitHub repository
3. Sign up/log in to [Railway.app](https://railway.app/)
4. Click "New Project" in the Railway dashboard
5. Select "Deploy from GitHub repo"
6. Connect your GitHub account if not already connected
7. Select the repository with your bot code
8. Railway will automatically deploy your bot

### Method 2: Deploy using Railway CLI

1. Install Railway CLI:
   ```
   npm i -g @railway/cli
   ```

2. Login to Railway:
   ```
   railway login
   ```

3. Initialize a new Railway project in your bot directory:
   ```
   railway init
   ```

4. Deploy your bot:
   ```
   railway up
   ```

## Configure Environment Variables

After deployment, you need to set up your environment variables:

1. Go to your project in the Railway dashboard
2. Click on "Variables"
3. Add the following environment variables:
   - `TELEGRAM_BOT_TOKEN`: Your Telegram Bot Token
   - `ANTHROPIC_API_KEY`: Your Anthropic API Key
   - `ANTHROPIC_MODEL`: claude-3-7-sonnet-20240307
   - `IS_HEROKU`: true (this enables the in-memory file storage system)
   - `SERVER_URL`: Your Railway app URL (will be something like https://your-app-name.railway.app)

## Setting up Custom Domain (Optional)

1. Go to your project in the Railway dashboard
2. Click on "Settings" and then "Domains"
3. Click "Generate Domain" to get a railway.app subdomain, or add your own custom domain

## Monitoring Your Bot

Railway provides logs and metrics for your deployed application:

1. Go to your project in the Railway dashboard
2. Click on "Deployments" to see deployment history
3. Click on the latest deployment to view logs

## Troubleshooting

- **Application Crashes**: Check logs in the Railway dashboard
- **Bot Not Responding**: Ensure all environment variables are set correctly
- **File Upload Issues**: The bot uses in-memory storage; files will be lost when the service restarts

## Notes on File Uploads

Your bot is configured to handle file uploads using an in-memory storage system. Uploaded files will be available for the duration of the app's runtime but will be lost if the app restarts or redeploys.

For production use with many file uploads, consider using cloud storage like AWS S3 or Google Cloud Storage. 