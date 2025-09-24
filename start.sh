#!/bin/bash

# Check if OpenRouter API key is set
if [ -z "$OPENROUTER_API_KEY" ]; then
    echo "Error: OPENROUTER_API_KEY environment variable is not set"
    echo "Please set your OpenRouter API key:"
    echo "export OPENROUTER_API_KEY='your-api-key-here'"
    echo ""
    echo "Or create a .env file with:"
    echo "OPENROUTER_API_KEY=your-api-key-here"
    exit 1
fi

echo "Starting PromptLab..."
echo "Backend server will run on http://localhost:3001"
echo "Frontend will run on http://localhost:5173"
echo ""

# Start backend in background
node server/index.js &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Start frontend
npm run dev

# Cleanup function
cleanup() {
    echo "Shutting down..."
    kill $BACKEND_PID 2>/dev/null
    exit 0
}

# Trap Ctrl+C
trap cleanup INT

# Wait for background process
wait $BACKEND_PID