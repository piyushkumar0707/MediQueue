/**
 * Send a standardised error JSON response.
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {string} [code]  Optional machine-readable error code
 */
export const errorResponse = (res, statusCode, message, code) => {
  const body = { success: false, message };
  if (code) body.code = code;
  return res.status(statusCode).json(body);
};
