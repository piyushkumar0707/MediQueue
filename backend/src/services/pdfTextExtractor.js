import { createRequire } from 'module';
import { logger } from '../utils/logger.js';

// pdf-parse v2 uses ESM-compatible CJS exports
const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

/**
 * Extract text from a PDF buffer.
 *
 * @param {Buffer} buffer  Raw PDF bytes
 * @returns {{ text: string, pages: number }}
 * @throws {{ code: 'IMAGE_ONLY' | 'PARSE_ERROR', message: string }}
 */
export async function extractTextFromPDF(buffer) {
  let result;
  try {
    const parser = new PDFParse({ data: buffer });
    result = await parser.getText();
  } catch (err) {
    logger.warn(`[PDF] parse error: ${err.message} (buffer size: ${buffer.length}, first bytes: ${buffer.slice(0,5).toString('hex')})`);
    throw Object.assign(new Error(`Failed to parse PDF: ${err.message}`), { code: 'PARSE_ERROR' });
  }

  const text = (result.text || '').trim();

  if (text.length < 50) {
    // Very short text after parsing usually means a scanned/image-only PDF
    throw Object.assign(
      new Error('This PDF appears to be a scanned image. AI summarization requires a text-based PDF.'),
      { code: 'IMAGE_ONLY' },
    );
  }

  return {
    text: text.slice(0, 12000), // cap at ~12k chars to stay within Groq token limits
    pages: result.total,
  };
}
