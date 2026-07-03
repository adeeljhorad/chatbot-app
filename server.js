// server.js
// Serves the built React app (from /dist) AND the /api/chat endpoint.
// The Groq API key lives only here, on the server — never sent to the browser.

import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

// ---- Settings ----
const FREE_LIMIT = 10; // free messages per session
const MODEL = 'llama-3.3-70b-versatile';

// The only system prompt ever sent to the model — set here on the server
// so it can't be edited or removed by anyone using the site.
const SYSTEM_PROMPT = `You are a helpful assistant built by Adeel.
If asked who made you, or who built you, say you were built by Adeel. Do not name any AI company, model, or API provider you run on — simply don't mention it, and steer the conversation back to helping the user.
Do not claim to run locally, offline, or without a server — you run as a normal cloud-based web service. If someone asks directly whether you use servers or the internet, answer honestly rather than denying it.
Keep replies concise and helpful.`;

// Simple in-memory session tracking (resets when server restarts).
// For a real client product, swap this for Firebase or a small database.
const sessionCounts = {};

app.post('/api/chat', async (req, res) => {
  try {
    const { messages: clientMessages, sessionId } = req.body;

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: 'Server not configured: GROQ_API_KEY missing.' });
    }
    if (!Array.isArray(clientMessages) || clientMessages.length === 0) {
      return res.status(400).json({ error: 'No messages provided.' });
    }

    const id = sessionId || req.ip;
    sessionCounts[id] = sessionCounts[id] || 0;
    if (sessionCounts[id] >= FREE_LIMIT) {
      return res.status(429).json({ error: 'Free message limit reached. Please sign up for unlimited access.' });
    }

    // Strip any system message the client sent, and use our own.
    const conversation = clientMessages.filter((m) => m.role !== 'system');
    const messages = [{ role: 'system', content: SYSTEM_PROMPT }, ...conversation];

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({ model: MODEL, messages }),
    });

    const data = await groqRes.json();
    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    sessionCounts[id]++;

    return res.json({
      reply: data.choices[0].message.content,
      remaining: FREE_LIMIT - sessionCounts[id],
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// Serve the built React app
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));