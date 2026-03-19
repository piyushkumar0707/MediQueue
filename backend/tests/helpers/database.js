import mongoose from 'mongoose';

export const clearDatabase = async () => {
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  const collections = mongoose.connection.collections;
  const cleanupPromises = Object.values(collections).map((collection) => collection.deleteMany({}));
  await Promise.all(cleanupPromises);
};

export const closeDatabaseConnection = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
};
