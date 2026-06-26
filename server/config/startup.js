const { MongoMemoryServer } = require('mongodb-memory-server');
const connectDB = require('./db');

let mongod = null;

async function startWithMemoryDB() {
  const uri = process.env.MONGODB_URI;

  if (process.env.USE_MEMORY_DB === 'true') {
    mongod = await MongoMemoryServer.create();
    const memUri = mongod.getUri('virtualcare');
    await connectDB(memUri);
    console.log('Using in-memory MongoDB (USE_MEMORY_DB=true)');
    return;
  }

  try {
    await connectDB(uri);
  } catch (err) {
    console.warn(`MongoDB unavailable (${err.message}). Starting in-memory database...`);
    mongod = await MongoMemoryServer.create();
    const memUri = mongod.getUri('virtualcare');
    await connectDB(memUri);
  }
}

async function stopMemoryDB() {
  if (mongod) await mongod.stop();
}

module.exports = { startWithMemoryDB, stopMemoryDB };
