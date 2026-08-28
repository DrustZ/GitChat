// Provider selection: LLM_PROVIDER=anthropic (default) | openai.
// Each provider implements streamMessage(messages, systemPrompt) and returns an
// async iterable of text deltas. Only the selected provider is loaded, so only
// its API key needs to be present.
const provider = (process.env.LLM_PROVIDER || 'anthropic').toLowerCase();

if (provider === 'anthropic') {
  module.exports = require('./anthropic');
} else if (provider === 'openai') {
  module.exports = require('./openai');
} else {
  throw new Error(`Unknown LLM_PROVIDER "${process.env.LLM_PROVIDER}" - use "anthropic" or "openai"`);
}
