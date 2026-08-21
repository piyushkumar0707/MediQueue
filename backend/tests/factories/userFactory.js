import User from '../../src/models/User.js';

// Use a per-process random base so parallel Jest workers don't collide on
// unique-indexed fields (e.g. phoneNumber). Each worker picks a different
// 4-digit prefix (1000–9999), giving 9000 possible slots × 10000 per slot.
const WORKER_BASE = (1000 + Math.floor(Math.random() * 9000)) * 10000;
let userCounter = 0;


const nextCounter = () => {
  userCounter += 1;
  return userCounter;
};

export const buildUserPayload = (overrides = {}) => {
  const counter = nextCounter();
  const uid = WORKER_BASE + counter;

  return {
    phoneNumber: `${uid}`,
    countryCode: '+91',
    email: `test.user.${uid}@example.com`,
    password: 'Password@123',
    role: 'patient',
    personalInfo: {
      firstName: 'Test',
      lastName: `User${uid}`,
      dateOfBirth: new Date('1995-01-01'),
      gender: 'other',
    },
    ...overrides,
  };
};

export const createUser = async (overrides = {}) => {
  const payload = buildUserPayload(overrides);
  const user = new User(payload);
  await user.save({ validateModifiedOnly: true });
  return user;
};
