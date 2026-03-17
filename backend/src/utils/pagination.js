/**
 * Parse pagination query params safely.
 * @param {Object} query - req.query
 * @param {number} defaultLimit - default page size (default: 10)
 * @param {number} maxLimit - hard cap to prevent unbounded queries (default: 100)
 * @returns {{ page: number, limit: number, skip: number }}
 */
export const parsePagination = (query, defaultLimit = 10, maxLimit = 100) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};
