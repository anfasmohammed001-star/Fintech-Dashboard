const mongoose = require('mongoose');

let useMock = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.trim() === '') {
    console.warn('\x1b[33m%s\x1b[0m', '⚠️ WARNING: MONGODB_URI is not set. Falling back to local file-based database storage.');
    useMock = true;
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log('✅ MongoDB Connected Successfully.');
  } catch (err) {
    console.error(`❌ MongoDB Connection Error: ${err.message}`);
    console.warn('\x1b[33m%s\x1b[0m', '⚠️ Falling back to local file-based database storage.');
    useMock = true;
  }
};

const isMock = () => useMock;

module.exports = { connectDB, isMock };
