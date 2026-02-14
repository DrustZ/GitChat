const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8000;

// Configure CORS
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:3000'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Configure OpenAI API
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

let systemPrompt;

async function loadSystemPrompt() {
  try {
    systemPrompt = await fs.readFile(path.join(__dirname, "llm-branched-conversation-prompt.md"), "utf-8");
  } catch (error) {
    console.error("Error loading system prompt:", error);
    process.exit(1);
  }
}

app.post("/generate", async (req, res) => {
  try {
    const data = req.body;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(data) }
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      if (chunk.choices[0]?.delta?.content) {
        res.write(`data: ${JSON.stringify({ content: chunk.choices[0].delta.content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ content: "[DONE]" })}\n\n`);
    res.end();
  } catch (error) {
    console.error("Error in generate endpoint:", error);
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  await loadSystemPrompt();
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

startServer();