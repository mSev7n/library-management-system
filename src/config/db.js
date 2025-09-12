// src/config/db.js
// This is responsible for connecting to MongoDB using mongoose

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // connect using the MONGO_URI from .env
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true, // ✅ comma instead of semicolon
    });

    // log success
    console.log("✅ MongoDB Connected Successfully");
    console.log(`🌍 Host: ${conn.connection.host}`);
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    // exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;
