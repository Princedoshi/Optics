const mongoose = require("mongoose");
const { Client } = require("pg");
require("dotenv").config();

/**
 * Connect to MongoDB
 */
const connectMongoDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI environment variable is not defined");
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected");
    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error.message);
        process.exit(1);
    }
};


module.exports = { connectMongoDB };
