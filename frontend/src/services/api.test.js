import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import { vi } from 'vitest';
import api, { clearAuthTokens, setAuthTokens } from './api';

describe('api service', () => {
  let mock;
  let axiosPostSpy;
  let setTimeoutSpy;

  beforeEach(() => {
    mock = new MockAdapter(api);
    axiosPostSpy = vi.spyOn(axios, 'post');
    setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
  });

  afterEach(() => {
    clearAuthTokens();
    axiosPostSpy.mockRestore();
    setTimeoutSpy.mockRestore();
    mock.restore();
  });

  test('attaches bearer token when access token is present', async () => {
    setAuthTokens('test-access-token', 'test-refresh-token');

    mock.onGet('/notifications/unread-count').reply((config) => {
      expect(config.headers.Authorization).toBe('Bearer test-access-token');
      return [200, { success: true, data: { count: 0 } }];
    });

    const response = await api.get('/notifications/unread-count');

    expect(response.success).toBe(true);
    expect(response.data.count).toBe(0);
  });

  test('returns auth endpoint 401 without attempting refresh', async () => {
    mock.onPost('/auth/login').reply(401, {
      success: false,
      message: 'Invalid credentials',
    });

    await expect(
      api.post('/auth/login', { phoneOrEmail: 'x@example.com', password: 'bad-pass' })
    ).rejects.toMatchObject({
      success: false,
      message: 'Invalid credentials',
    });

    expect(axiosPostSpy).not.toHaveBeenCalled();
  });

  test('retries original request after successful token refresh', async () => {
    setAuthTokens('expired-access-token', 'test-refresh-token');

    mock
      .onGet('/users/doctors')
      .replyOnce(401, { success: false, message: 'Expired access token' })
      .onGet('/users/doctors')
      .reply(200, { success: true, data: [] });

    axiosPostSpy.mockResolvedValueOnce({
      data: {
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        },
      },
    });

    const response = await api.get('/users/doctors');

    expect(axiosPostSpy).toHaveBeenCalledTimes(1);
    expect(axiosPostSpy).toHaveBeenCalledWith(
      expect.stringContaining('/auth/refresh-token'),
      {},
      { withCredentials: true }
    );
    expect(response.success).toBe(true);
  });

  test('rejects request and schedules redirect when refresh fails', async () => {
    mock.onGet('/users/doctors').replyOnce(401, {
      success: false,
      message: 'Expired access token',
    });

    axiosPostSpy.mockRejectedValueOnce(new Error('refresh failed'));

    await expect(api.get('/users/doctors')).rejects.toThrow('refresh failed');
    expect(axiosPostSpy).toHaveBeenCalledTimes(1);
    expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
    expect(setTimeoutSpy.mock.calls[0][1]).toBe(1500);
  });
});
