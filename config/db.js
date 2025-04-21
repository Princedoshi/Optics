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

/**
 * Connect to Supabase PostgreSQL using a single client
 */
const connectSupabase = async () => {
    try {
        console.log("Connecting to Supabase PostgreSQL...");

        if (!process.env.SUPABASE_DB_URL) {
            throw new Error("SUPABASE_DB_URL environment variable is not defined");
        }

        const client = new Client({
            connectionString: process.env.SUPABASE_DB_URL,
            family: 4, // Force IPv4
        });

        await client.connect();
        console.log("✅ Supabase PostgreSQL Client Connected");

        return client;

    } catch (error) {
        console.error("❌ Supabase Connection Error:", error.message);
        process.exit(1);
    }
};

module.exports = { connectMongoDB, connectSupabase };
