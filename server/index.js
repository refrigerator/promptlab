const express = require('express');
const cors = require('cors');
const axios = require('axios');
const db = require('./database');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// OpenRouter API configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Get available models from OpenRouter
app.get('/api/models', async (req, res) => {
  if (!OPENROUTER_API_KEY) {
    return res.status(400).json({ error: 'OpenRouter API key not configured' });
  }
  
  try {
    const response = await axios.get(`${OPENROUTER_BASE_URL}/models`, {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

// Get all folders
app.get('/api/folders', (req, res) => {
  db.all('SELECT * FROM folders ORDER BY name', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Create folder
app.post('/api/folders', (req, res) => {
  const { name, parent_id } = req.body;
  db.run('INSERT INTO folders (name, parent_id) VALUES (?, ?)', [name, parent_id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, name, parent_id });
  });
});

// Get all chats with folder information
app.get('/api/chats', (req, res) => {
  const query = `
    SELECT c.*, f.name as folder_name 
    FROM chats c 
    LEFT JOIN folders f ON c.folder_id = f.id 
    ORDER BY c.updated_at DESC
  `;
  db.all(query, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Create new chat
app.post('/api/chats', (req, res) => {
  const { title, folder_id } = req.body;
  db.run('INSERT INTO chats (title, folder_id) VALUES (?, ?)', [title, folder_id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, title, folder_id });
  });
});

// Update chat rating
app.put('/api/chats/:id/rating', (req, res) => {
  const { id } = req.params;
  const { rating } = req.body;
  db.run('UPDATE chats SET rating = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [rating, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ success: true });
  });
});

// Get messages for a chat
app.get('/api/chats/:id/messages', (req, res) => {
  const { id } = req.params;
  db.all('SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC', [id], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Add message to chat
app.post('/api/chats/:id/messages', (req, res) => {
  const { id } = req.params;
  const { role, content, llm_provider, llm_model, temperature, max_tokens, response_time_ms, tokens_used, estimated_cost } = req.body;
  
  db.run(
    'INSERT INTO messages (chat_id, role, content, llm_provider, llm_model, temperature, max_tokens, response_time_ms, tokens_used, estimated_cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, role, content, llm_provider, llm_model, temperature, max_tokens, response_time_ms, tokens_used, estimated_cost],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID });
    }
  );
});

// Send message to multiple LLMs
app.post('/api/chats/:id/send', async (req, res) => {
  if (!OPENROUTER_API_KEY) {
    return res.status(400).json({ error: 'OpenRouter API key not configured' });
  }
  
  const { id } = req.params;
  const { message, llm_configs } = req.body;
  
  try {
    // Save user message
    const userMessage = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO messages (chat_id, role, content) VALUES (?, ?, ?)',
        [id, 'user', message],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });

    // Send to each LLM
    const responses = await Promise.allSettled(
      llm_configs.map(async (config) => {
        const startTime = Date.now();
        try {
          const response = await axios.post(
            `${OPENROUTER_BASE_URL}/chat/completions`,
            {
              model: config.model,
              messages: [{ role: 'user', content: message }],
              temperature: config.temperature,
              max_tokens: config.max_tokens
            },
            {
              headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json'
              }
            }
          );

          const responseTime = Date.now() - startTime;
          const content = response.data.choices[0].message.content;
          const tokensUsed = response.data.usage?.total_tokens || 0;
          
          // Estimate cost (rough calculation)
          const estimatedCost = tokensUsed * 0.0001; // Very rough estimate

          // Save assistant message
          const assistantMessage = await new Promise((resolve, reject) => {
            db.run(
              'INSERT INTO messages (chat_id, role, content, llm_provider, llm_model, temperature, max_tokens, response_time_ms, tokens_used, estimated_cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [id, 'assistant', content, 'openrouter', config.model, config.temperature, config.max_tokens, responseTime, tokensUsed, estimatedCost],
              function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID });
              }
            );
          });

          return {
            success: true,
            content,
            responseTime,
            tokensUsed,
            estimatedCost,
            model: config.model,
            messageId: assistantMessage.id
          };
        } catch (error) {
          console.error(`Error with model ${config.model}:`, error);
          return {
            success: false,
            error: error.message,
            model: config.model
          };
        }
      })
    );

    res.json({
      userMessageId: userMessage.id,
      responses: responses.map(r => r.status === 'fulfilled' ? r.value : r.reason)
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});