import { expect, test } from '@jest/globals';
import { joinAuthenticatedRooms } from '../../src/services/socketRoomJoin.js';

test('joining authenticated rooms works without an acknowledgement callback', async () => {
  const joinedRooms = [];
  const socket = {
    join: async (room) => joinedRooms.push(room),
  };

  await expect(joinAuthenticatedRooms(socket, { userId: 'user-1', role: 'patient' }))
    .resolves.toBeUndefined();

  expect(joinedRooms).toEqual(['user:user-1', 'role:patient']);
});
