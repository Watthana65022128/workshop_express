require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required');
  const uri = new URL(process.env.MONGO_URI);
  if (uri.protocol !== 'mongodb:' || uri.hostname !== 'localhost' || uri.port !== '27018') {
    throw new Error('This script only initializes MongoDB on localhost:27018');
  }

  uri.pathname = '/admin';
  uri.search = '?directConnection=true';
  await mongoose.connect(uri.toString(), { serverSelectionTimeoutMS: 5000 });
  const admin = mongoose.connection.db.admin();

  try {
    await admin.command({ replSetInitiate: {
      _id: 'rs0',
      members: [{ _id: 0, host: 'localhost:27018' }]
    } });
    console.log('Replica set rs0 initialized');
  } catch (error) {
    if (error.code !== 23) throw error;
    console.log('Replica set rs0 already initialized');
  }

  for (let attempt = 0; attempt < 30; attempt++) {
    const state = await admin.command({ hello: 1 });
    if (state.isWritablePrimary) {
      console.log('MongoDB primary is ready');
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error('MongoDB did not become primary within 30 seconds');
}

main().catch((error) => {
  console.error('MongoDB initialization failed:', error);
  process.exitCode = 1;
}).finally(() => mongoose.disconnect());
