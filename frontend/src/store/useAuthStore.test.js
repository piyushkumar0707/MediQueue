import { beforeEach, describe, expect, test, vi } from 'vitest';
import useAuthStore from './useAuthStore';

vi.mock('../services/api', () => ({
  default: {
    post: vi.fn().mockResolvedValue({ success: true }),
  },
  clearAuthQueue: vi.fn(),
  setAuthTokens: vi.fn(),
  clearAuthTokens: vi.fn(),
}));

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorage.clear();

    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  test('logout clears auth state and persisted storage', async () => {
    localStorage.setItem('auth-storage', JSON.stringify({ state: { isAuthenticated: true } }));

    useAuthStore.setState({
      user: { _id: 'u1', role: 'patient' },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      isAuthenticated: true,
      error: 'some-error',
    });

    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();

    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toBeNull();
    expect(localStorage.getItem('auth-storage')).toBeNull();
  });
});
