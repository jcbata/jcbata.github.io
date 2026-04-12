const express = require('express');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const path = require('path');

const app = express();
const PORT = 3000;
const OLLAMA_API_BASE_URL = 'http://localhost:11434'; // Assuming Ollama is running locally

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Proxy for /api/generate
app.post('/api/ollama/generate', async (req, res) => {
    try {
        const ollamaRes = await fetch(`${OLLAMA_API_BASE_URL}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body),
        });

        if (!ollamaRes.ok) {
            const errorText = await ollamaRes.text();
            console.error(`Ollama API error: ${ollamaRes.status} - ${errorText}`);
            return res.status(ollamaRes.status).send(errorText);
        }

        // Stream the response from Ollama to the client
        res.setHeader('Content-Type', 'application/x-ndjson');
        ollamaRes.body.pipe(res);

    } catch (error) {
        console.error('Error proxying generate request to Ollama:', error);
        res.status(500).send('Error proxying generate request to Ollama.');
    }
});

// Proxy for /api/chat
app.post('/api/ollama/chat', async (req, res) => {
    try {
        const ollamaRes = await fetch(`${OLLAMA_API_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body),
        });

        if (!ollamaRes.ok) {
            const errorText = await ollamaRes.text();
            console.error(`Ollama API error: ${ollamaRes.status} - ${errorText}`);
            return res.status(ollamaRes.status).send(errorText);
        }

        // Stream the response from Ollama to the client
        res.setHeader('Content-Type', 'application/x-ndjson');
        ollamaRes.body.pipe(res);

    } catch (error) {
        console.error('Error proxying chat request to Ollama:', error);
        res.status(500).send('Error proxying chat request to Ollama.');
    }
});

// Proxy for /api/tags (list models)
app.get('/api/ollama/models', async (req, res) => {
    try {
        const ollamaRes = await fetch(`${OLLAMA_API_BASE_URL}/api/tags`);
        if (!ollamaRes.ok) {
            const errorText = await ollamaRes.text();
            console.error(`Ollama API error: ${ollamaRes.status} - ${errorText}`);
            return res.status(ollamaRes.status).send(errorText);
        }
        const data = await ollamaRes.json();
        res.json(data);
    } catch (error) {
        console.error('Error proxying models request to Ollama:', error);
        res.status(500).send('Error proxying models request to Ollama.');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
