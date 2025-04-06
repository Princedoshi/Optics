const mongoose = require("mongoose");
const { Client } = require("pg");
require("dotenv").config();

/**
 * Connect to MongoDB
 */
const connectMongoDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected");
    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error);
        process.exit(1);
    }
};

/**
 * Connect to Supabase PostgreSQL
 */
// const connectSupabase = async () => {
//     try {
//         console.log("Connecting to Supabase PostgreSQL...");
//         // Check if the connection string is defined
//         if (!process.env.SUPABASE_DB_URL) {
//             throw new Error("Supabase connection string is not defined");
//         }
//         // Create a new PostgreSQL client
//         const supabaseClient = new Client({
//             connectionString: process.env.SUPABASE_DB_URL,
//         });

//         await supabaseClient.connect();
//         console.log("✅ Supabase PostgreSQL Connected");

//         return supabaseClient;
//     } catch (error) {
//         console.error("❌ Supabase Connection Error:", error);
//         process.exit(1);
//     }
// };

module.exports = { connectMongoDB };
