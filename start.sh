#!/bin/bash

# Check if Node.js is installed
if ! command -v node > /dev/null; then
  echo "Error: Node.js is not installed"
  echo "Please install Node.js from https://nodejs.org/"
  exit 1
fi

# Check if npm is installed
if ! command -v npm > /dev/null; then
  echo "Error: npm is not installed"
  echo "Please install npm (it should come with Node.js)"
  exit 1
fi

# Install dependencies if they don't exist
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    echo "Error: .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "Please edit .env with your API keys before running the bot"
    exit 1
  else
    echo "Error: Neither .env nor .env.example found"
    exit 1
  fi
fi

# Start the bot
echo "Starting Claude Telegram Bot..."
npm start 