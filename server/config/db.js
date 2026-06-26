const mongoose = require('mongoose');

const connectDB = async (uri) => {
  const conn = await mongoose.connect(uri || process.env.MONGODB_URI);
  console.log(`MongoDB connected: ${conn.connection.host}`);
  return conn;
};

module.exports = connectDB;
