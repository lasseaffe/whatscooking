// scripts/lib/openrouter.mjs
import https from 'https';

const DEFAULT_MODEL = 'meta-llama/llama-3.1-8b-instruct';
const BACKOFF_MS = [2000, 4000, 8000];

export async function callOpenRouter({ apiKey, model = DEFAULT_MODEL, systemPrompt, userPrompt, temperature = 0.3, maxTokens = 600 }) {
  const body = JSON.stringify({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt },
    ],
    temperature,
    max_tokens: maxTokens,
  });

  for (let attempt = 0; attempt <= BACKOFF_MS.length; attempt++) {
    let statusCode;
    try {
      const text = await new Promise((resolve, reject) => {
        const req = https.request({
          hostname: 'openrouter.ai',
          path: '/api/v1/chat/completions',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://whatscooking.app',
            'X-Title': 'WC Backfill',
            'Content-Length': Buffer.byteLength(body),
          },
        }, res => {
          statusCode = res.statusCode;
          let raw = '';
          res.on('data', c => raw += c);
          res.on('end', () => resolve(raw));
          res.on('error', reject);
        });
        req.on('error', reject);
        req.write(body);
        req.end();
      });

      if (statusCode === 429 || statusCode >= 500) {
        if (attempt < BACKOFF_MS.length) {
          process.stdout.write(` [${statusCode} retry ${attempt + 1}]`);
          await sleep(BACKOFF_MS[attempt]);
          continue;
        }
        throw new Error(`OpenRouter ${statusCode} after ${attempt + 1} attempts`);
      }

      const data = JSON.parse(text);
      const content = data?.choices?.[0]?.message?.content;
      if (!content) throw new Error('Empty OpenRouter response: ' + text.slice(0, 200));
      return content;
    } catch (e) {
      if (attempt < BACKOFF_MS.length && !String(e.message).startsWith('OpenRouter')) {
        process.stdout.write(` [err retry ${attempt + 1}]`);
        await sleep(BACKOFF_MS[attempt]);
        continue;
      }
      throw e;
    }
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
