# PromptLab - LLM Prompt Experimentation Platform

A comprehensive platform for testing and iterating on LLM prompts with multiple models simultaneously.

## Features

- **Multi-LLM Comparison**: Run the same prompt with multiple LLMs simultaneously to compare outputs
- **Customizable Parameters**: Adjust temperature, max tokens, and other model-specific parameters
- **Chat History**: Automatically save and browse chat sessions with easy navigation
- **Rating System**: Rate chats from 1-10 to easily find the best ones
- **Metadata Tracking**: Track response times, token usage, and estimated costs
- **Folder Organization**: Organize chats into nested folders for better management
- **2D Grid Interface**: Unique horizontal scrolling chat interface with model rows

## Technical Stack

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Database**: SQLite with better-sqlite3
- **LLM Access**: OpenRouter API for accessing multiple LLM providers
- **UI Components**: Lucide React icons

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set up Environment Variables**
   - Copy `.env.local` to `.env.local`
   - Get your OpenRouter API key from [https://openrouter.ai/keys](https://openrouter.ai/keys)
   - Replace `your_openrouter_api_key_here` with your actual API key

3. **Sync LLM Models**
   ```bash
   # Start the development server
   npm run dev
   
   # In another terminal, sync models from OpenRouter
   curl -X POST http://localhost:3000/api/sync-models
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Open the Application**
   - Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. **Create a New Chat**: Click the "+" button in the chat list
2. **Add Models**: Select models from the dropdown in the chat interface
3. **Customize Parameters**: Adjust temperature and max tokens for each model
4. **Send Messages**: Type your prompt and send to all selected models
5. **Compare Results**: View responses side-by-side in the 2D grid
6. **Rate Chats**: Use the star rating system to mark good conversations
7. **Organize**: Create folders to organize your experiments

## Database Schema

The application uses SQLite with the following main tables:
- `chats`: Store chat sessions with titles and ratings
- `messages`: Store individual messages with model metadata
- `folders`: Organize chats into hierarchical folders
- `llm_models`: Cache available LLM models from OpenRouter

## API Endpoints

- `GET /api/chats` - Get all chats, folders, and models
- `POST /api/chats` - Create a new chat
- `GET /api/chats/[id]` - Get a specific chat with messages
- `PUT /api/chats/[id]/rating` - Update chat rating
- `POST /api/messages` - Create a new message
- `POST /api/sync-models` - Sync models from OpenRouter

## Future Enhancements

- Output column for rendering final results
- Export functionality for chat data
- Advanced filtering and search
- Model performance analytics
- Collaborative features
