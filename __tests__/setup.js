import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

// Global test setup
beforeAll(async () => {
  try {
    // Try to connect to local MongoDB first
    await mongoose.connect('mongodb://localhost:27017/foodsewa_test');
    console.log('Connected to local MongoDB');
  } catch (error) {
    console.log('Local MongoDB not available, using in-memory database');
    // If local MongoDB is not available, use in-memory database
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  }
});

// Global test cleanup
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// Clean up between tests
beforeEach(async () => {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});

// Increase timeout for database operations
jest.setTimeout(30000);