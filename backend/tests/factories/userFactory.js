import User from '../../src/models/User.js';

// Use a per-process random 2-digit slot (00-99) so parallel Jest workers don't
// collide on unique-indexed fields (e.g. phoneNumber, email).
// Phone numbers are always exactly 10 digits: '9' + slot(2) + counter(7).
const WORKER_SLOT = String(Math.floor(Math.random() * 100)).padStart(2, '0');
let userCounter = 0;

const nextCounter = () => {
  userCounter += 1;
  return userCounter;
};

export const buildUserPayload = (overrides = {}) => {
  const counter = nextCounter();
  const counterPart = String(counter).padStart(7, '0');
  const phoneNumber = `9${WORKER_SLOT}${counterPart}`; // always 10 digits

  return {
    phoneNumber,
    countryCode: '+91',
    email: `test.user.${WORKER_SLOT}${counterPart}@example.com`,
    password: 'Password@123',
    role: 'patient',
    personalInfo: {
      firstName: 'Test',
      lastName: `User${WORKER_SLOT}${counterPart}`,
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
