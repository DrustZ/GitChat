const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

// Claude takes the system prompt as a top-level field, not a role:"system"
// message. max_tokens is required; 64000 is within the output cap of every
// current Claude model.
async function* streamMessage(messages, systemPrompt) {
  const stream = anthropic.messages.stream({
    model,
    max_tokens: 64000,
    system: systemPrompt,
    messages,
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text;
    }
  }
}

module.exports = { streamMessage };
