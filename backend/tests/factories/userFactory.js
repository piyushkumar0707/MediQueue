import User from '../../src/models/User.js';

let userCounter = 0;

const nextCounter = () => {
  userCounter += 1;
  return userCounter;
};

export const buildUserPayload = (overrides = {}) => {
  const counter = nextCounter();

  return {
    phoneNumber: `900000${String(counter).padStart(4, '0')}`,
    countryCode: '+91',
    email: `test.user.${counter}@example.com`,
    password: 'Password@123',
    role: 'patient',
    personalInfo: {
      firstName: 'Test',
      lastName: `User${counter}`,
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
