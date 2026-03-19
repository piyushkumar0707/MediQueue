export const applyTestEnv = () => {
  process.env.NODE_ENV = 'test';
  process.env.TZ = 'UTC';
  process.env.PORT = process.env.PORT || '5055';

  process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mediqueue_test';
  process.env.REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

  process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test_access_secret_32_chars_minimum';
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_refresh_secret_32_chars_minimum';
  process.env.JWT_MFA_SECRET = process.env.JWT_MFA_SECRET || 'test_mfa_secret_here_32_chars_ok';
  process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'test_encryption_key_32chars!';

  process.env.EMAIL_FROM = process.env.EMAIL_FROM || 'ci@example.com';
  process.env.EMAIL_USER = process.env.EMAIL_USER || 'ci@example.com';
  process.env.EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || 'ci-placeholder-pass';

  process.env.TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || 'ci_placeholder';
  process.env.TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || 'ci_placeholder';
  process.env.TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '+10000000000';
};
