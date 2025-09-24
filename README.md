# PromptLab - LLM Prompt Experimentation Platform

A comprehensive platform for testing and iterating on LLM prompts with support for multiple models, parameter customization, and organized chat management.

## Features

- **Multi-LLM Comparison**: Run the same prompt with multiple LLMs simultaneously to compare outputs
- **Parameter Customization**: Customize temperature, max tokens, and other parameters for each LLM
- **Chat Management**: Automatically save chat sessions with easy browsing and search
- **Rating System**: Rate chats from 1-10 to easily find the best ones
- **Metadata Tracking**: Track response times, token usage, and estimated costs
- **Folder Organization**: Organize chats into folders with unlimited nesting
- **OpenRouter Integration**: Access multiple LLMs through OpenRouter API
- **Modern UI**: Clean, responsive interface with horizontal scrollable chat layout

## Technical Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express
- **Database**: SQLite (easily switchable to other databases)
- **LLM Access**: OpenRouter API
- **Styling**: Custom CSS with modern design

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Set up OpenRouter API Key**:
   - Get an API key from [OpenRouter](https://openrouter.ai/)
   - Set the environment variable:
     ```bash
     export OPENROUTER_API_KEY="your-api-key-here"
     ```
   - Or create a `.env` file in the project root with:
     ```
     OPENROUTER_API_KEY=your-api-key-here
     ```

3. **Start the Development Server**:
   ```bash
   # Start the backend server
   npm run start

   # In a new terminal, start the frontend
   npm run dev
   ```

4. **Access the Application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## Usage

1. **Create a New Chat**: Click the "New" button in the chat list sidebar
2. **Add LLMs**: Click "Add LLM" to configure different models and parameters
3. **Send Messages**: Type your prompt and send to all configured LLMs simultaneously
4. **Compare Results**: View responses in a horizontal scrollable grid layout
5. **Rate Chats**: Click the star icon to rate chats from 1-10
6. **Organize**: Create folders to organize your chats
7. **Copy Content**: Use the copy button on any message to copy it to clipboard

## Database Schema

The application uses SQLite with the following main tables:
- `folders`: Hierarchical folder structure
- `chats`: Chat sessions with ratings and metadata
- `messages`: Individual messages with LLM parameters and performance data

## API Endpoints

- `GET /api/models` - Fetch available LLMs from OpenRouter
- `GET /api/chats` - Get all chats
- `POST /api/chats` - Create new chat
- `PUT /api/chats/:id/rating` - Update chat rating
- `GET /api/chats/:id/messages` - Get messages for a chat
- `POST /api/chats/:id/send` - Send message to multiple LLMs
- `GET /api/folders` - Get all folders
- `POST /api/folders` - Create new folder

## Development

- The frontend is built with Vite and hot-reloads on changes
- The backend uses Express with SQLite
- Database is automatically initialized on first run
- All API calls are proxied through Vite dev server

## Future Enhancements

- Export/import chat data
- Advanced filtering and search
- Custom output rendering in the output panel
- Team collaboration features
- Advanced analytics and insights
