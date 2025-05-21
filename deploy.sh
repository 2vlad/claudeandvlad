#!/bin/bash

# Simple deployment script for Claude Telegram Bot

# Function to check if the bot is running
check_running() {
  pgrep -f "node src/index.js" >/dev/null
  return $?
}

# Function to start the bot
start_bot() {
  echo "Starting Claude Telegram Bot..."
  if check_running; then
    echo "Bot is already running!"
  else
    # Create upload directory if it doesn't exist
    mkdir -p uploads
    
    # Start the bot in the background
    nohup node src/index.js > bot.log 2>&1 &
    
    # Give it a moment to start
    sleep 2
    
    if check_running; then
      echo "Bot started successfully!"
    else
      echo "Failed to start bot. Check bot.log for details."
    fi
  fi
}

# Function to stop the bot
stop_bot() {
  echo "Stopping Claude Telegram Bot..."
  if check_running; then
    pkill -f "node src/index.js"
    sleep 2
    
    if check_running; then
      echo "Failed to stop bot gracefully. Forcing termination..."
      pkill -9 -f "node src/index.js"
    else
      echo "Bot stopped successfully!"
    fi
  else
    echo "Bot is not running."
  fi
}

# Function to restart the bot
restart_bot() {
  stop_bot
  start_bot
}

# Function to show bot status
status_bot() {
  if check_running; then
    echo "Claude Telegram Bot is running."
    
    # Show process info
    ps -ef | grep "node src/index.js" | grep -v grep
    
    # Show last few log entries
    echo -e "\nLast 10 log entries:"
    tail -10 bot.log
  else
    echo "Claude Telegram Bot is not running."
  fi
}

# Main script logic
case "$1" in
  start)
    start_bot
    ;;
  stop)
    stop_bot
    ;;
  restart)
    restart_bot
    ;;
  status)
    status_bot
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status}"
    exit 1
    ;;
esac

exit 0 