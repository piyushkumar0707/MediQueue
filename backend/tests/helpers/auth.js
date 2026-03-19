import { generateAccessToken } from '../../src/utils/jwt.js';

export const createAuthHeader = (user) => {
  const token = generateAccessToken({
    id: user._id,
    role: user.role,
    permissions: user.permissions || [],
  });

  return { Authorization: `Bearer ${token}` };
};
