import axios from 'axios';

/**
 * Fetch a file from a URL (e.g. a signed Cloudinary URL) and return its raw bytes as a Buffer.
 *
 * @param {string} url  Signed or public URL
 * @returns {Promise<Buffer>}
 */
export async function fetchFileAsBuffer(url) {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 15000,
  });
  return Buffer.from(response.data);
}
