const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
require('dotenv').config();

// dotenv must run before this require: the provider reads its API key on load
const llm = require('./llm');

const app = express();
const port = 8000;

// Configure CORS
app.use(cors({
  origin: 'http://localhost:3000', // Replace with your frontend URL
  credentials: true
}));
app.use(express.json());

let systemPrompt;

async function loadSystemPrompt() {
  try {
    systemPrompt = await fs.readFile("llm-branched-conversation-prompt.md", "utf-8");
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

    const stream = llm.streamMessage(
      [{ role: "user", content: JSON.stringify(data) }],
      systemPrompt
    );

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ content: "[DONE]" })}\n\n`);
    res.end();
  } catch (error) {
    console.error("Error in generate endpoint:", error);
    if (res.headersSent) {
      // The SSE stream is already open: res.status(500) here would throw
      // ERR_HTTP_HEADERS_SENT and kill the process, so report in-stream instead.
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.write(`data: ${JSON.stringify({ content: "[DONE]" })}\n\n`);
      res.end();
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

async function startServer() {
  await loadSystemPrompt();
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

startServer();
