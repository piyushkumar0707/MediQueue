export const joinAuthenticatedRooms = async (socket, user, acknowledge) => {
  await Promise.all([
    socket.join(`user:${user.userId}`),
    socket.join(`role:${user.role}`),
  ]);

  if (typeof acknowledge === 'function') acknowledge({ joined: true });
};
