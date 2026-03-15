import Groq from 'groq-sdk';
import { logger } from '../utils/logger.js';

// ─── Feature flags ────────────────────────────────────────────────────────────
export const AI_FEATURES = {
  triage:        process.env.AI_FEATURE_TRIAGE         !== 'false',
  summarize:     process.env.AI_FEATURE_SUMMARIZE      !== 'false',
  imageAnalysis: process.env.AI_FEATURE_IMAGE_ANALYSIS !== 'false',
};

// ─── Groq client (lazy — only created when first AI call is made) ─────────────
let _groq = null;

function getGroqClient() {
  if (!process.env.GROQ_API_KEY) return null;
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _groq;
}

// ─── PII redaction ────────────────────────────────────────────────────────────
const PII_PATTERNS = [
  // email addresses
  { re: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, replacement: '[EMAIL]' },
  // phone numbers (loose — 7-15 digits, optional +/- separators)
  { re: /\+?[\d][\d\s\-().]{6,14}\d/g, replacement: '[PHONE]' },
  // MongoDB ObjectId-shaped strings (24 hex chars)
  { re: /\b[0-9a-fA-F]{24}\b/g, replacement: '[ID]' },
  // Common name patterns — "Name: <value>" or "Patient: <value>"
  { re: /(?:patient|name|dr\.?|doctor)\s*:\s*[^\n,;]+/gi, replacement: '[NAME]' },
];

export function redactPII(text) {
  if (typeof text !== 'string') return text;
  let result = text;
  for (const { re, replacement } of PII_PATTERNS) {
    result = result.replace(re, replacement);
  }
  return result;
}

// ─── JSON schema validator (lightweight) ─────────────────────────────────────
function validateSchema(obj, schema) {
  for (const [key, type] of Object.entries(schema)) {
    if (!(key in obj)) return `Missing field: ${key}`;
    if (type === 'array' && !Array.isArray(obj[key])) return `Field ${key} must be array`;
    if (type !== 'array' && typeof obj[key] !== type) return `Field ${key} must be ${type}`;
  }
  return null; // valid
}

// ─── Core AI call wrapper ─────────────────────────────────────────────────────
/**
 * callAI — central wrapper for all Groq calls.
 *
 * @param {string} systemPrompt
 * @param {string} userPrompt   — already PII-stripped by the caller
 * @param {object} schema       — { fieldName: 'string'|'number'|'boolean'|'array' }
 * @param {object} options
 * @param {string} options.promptVersion  e.g. 'triage-v1'
 * @param {number} options.temperature    default 0.1
 * @param {string} options.model          default 'llama-3.1-8b-instant'
 * @param {number} options.timeoutMs      default 8000
 * @param {number} options.maxRetries     default 1
 *
 * @returns {{ success, data, model, latencyMs, promptVersion, fallback }}
 */
export async function callAI(systemPrompt, userPrompt, schema, options = {}) {
  const {
    promptVersion = 'unknown',
    temperature   = 0.1,
    model         = 'llama-3.1-8b-instant',
    timeoutMs     = 8000,
    maxRetries    = 1,
  } = options;

  const envelope = {
    success:       false,
    data:          null,
    model,
    latencyMs:     0,
    promptVersion,
    fallback:      true,
  };

  const groq = getGroqClient();
  if (!groq) {
    logger.warn('[AI] GROQ_API_KEY not set — AI call skipped');
    return envelope;
  }

  const attempt = async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const t0 = Date.now();
      const completion = await groq.chat.completions.create(
        {
          model,
          temperature,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: userPrompt },
          ],
        },
        { signal: controller.signal },
      );
      envelope.latencyMs = Date.now() - t0;

      const raw = completion.choices[0]?.message?.content ?? '{}';
      const parsed = JSON.parse(raw);

      if (schema) {
        const err = validateSchema(parsed, schema);
        if (err) throw new Error(`Schema validation failed: ${err}`);
      }

      envelope.success  = true;
      envelope.data     = parsed;
      envelope.fallback = false;
      return true;
    } finally {
      clearTimeout(timer);
    }
  };

  for (let i = 0; i <= maxRetries; i++) {
    try {
      await attempt();
      break;
    } catch (err) {
      logger.warn(`[AI] attempt ${i + 1} failed (${promptVersion}): ${err.message}`);
      if (i === maxRetries) {
        logger.error(`[AI] all attempts failed (${promptVersion}): ${err.message}`);
      }
    }
  }

  // Telemetry — never log raw prompt content
  logger.info(`[AI] feature=${promptVersion} model=${model} latencyMs=${envelope.latencyMs} success=${envelope.success}`);

  return envelope;
}

// ─── Image prompt builder ─────────────────────────────────────────────────────
const IMAGE_PROMPTS = {
  default: `You are a medical assistant analyzing a medical document image.
Read all text visible in the image carefully, including any handwritten content.
Return ONLY valid JSON:
{
  "summary": "2-3 sentence plain-English summary for a non-medical reader",
  "keyFindings": ["finding 1", "finding 2"],
  "followUpNeeded": true,
  "transcriptionConfidence": "high | medium | low"
}

transcriptionConfidence guide:
  high   — text is printed or clearly handwritten, fully legible
  medium — some words unclear but overall meaning is confident
  low    — significant portions are illegible or ambiguous

If handwriting is partially unclear, note it in keyFindings.
Never diagnose. Never recommend treatment.
Do not include patient names or identifying information in the output.`,
};

export function buildImagePrompt(recordType) {
  return (IMAGE_PROMPTS[recordType] || IMAGE_PROMPTS.default)
    .replace('{recordType}', recordType || 'medical document');
}

// ─── Image analysis (multimodal) ─────────────────────────────────────────────
const IMAGE_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

/**
 * analyzeImage — calls Groq vision model with a base64-encoded image.
 *
 * @param {string} base64Image  Base64-encoded image content
 * @param {string} mimeType     'image/png' | 'image/jpeg'
 * @param {string} recordType   e.g. 'lab_report', 'prescription' — used for prompt selection
 * @returns {{ success, data, model, latencyMs, promptVersion, fallback }}
 */
export async function analyzeImage(base64Image, mimeType, recordType) {
  const envelope = {
    success:       false,
    data:          null,
    model:         IMAGE_MODEL,
    latencyMs:     0,
    promptVersion: 'image-v1',
    fallback:      true,
  };

  const groq = getGroqClient();
  if (!groq) {
    logger.warn('[AI] GROQ_API_KEY not set — image analysis skipped');
    return envelope;
  }

  const prompt = buildImagePrompt(recordType);

  try {
    const t0 = Date.now();
    const completion = await groq.chat.completions.create({
      model: IMAGE_MODEL,
      temperature: 0.2,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } },
          { type: 'text', text: prompt },
        ],
      }],
    });
    envelope.latencyMs = Date.now() - t0;

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw);

    // Validate required fields
    const required = ['summary', 'keyFindings', 'followUpNeeded', 'transcriptionConfidence'];
    for (const field of required) {
      if (!(field in parsed)) throw new Error(`Missing field: ${field}`);
    }

    envelope.success  = true;
    envelope.data     = parsed;
    envelope.fallback = false;
  } catch (err) {
    logger.error(`[AI] image analysis failed: ${err.message}`);
  }

  logger.info(`[AI] feature=image-v1 model=${IMAGE_MODEL} latencyMs=${envelope.latencyMs} success=${envelope.success}`);
  return envelope;
}
