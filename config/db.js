const mongoose = require("mongoose");
// *** Import Pool instead of Client ***
const { Pool } = require("pg");
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
 * Connect to Supabase PostgreSQL using a connection pool
 */
const connectSupabase = async () => {
    try {
        console.log("Connecting to Supabase PostgreSQL Pool...");

        if (!process.env.SUPABASE_DB_URL) {
            throw new Error("SUPABASE_DB_URL environment variable is not defined");
        }

        // *** Use Pool instead of Client ***
        const pool = new Pool({
            connectionString: process.env.SUPABASE_DB_URL,

            // *** Attempt to force IPv4 to resolve ENETUNREACH ***
            // This tells the underlying Node.js 'net' module to prefer IPv4.
            // Check your 'pg' version documentation if this exact syntax doesn't work.
            // It might be nested under 'connectionOptions' in some older versions.
            family: 4,

            // Optional but recommended Pool settings:
            max: 10, // Max number of clients in the pool (adjust as needed)
            idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed (ms)
            connectionTimeoutMillis: 5000, // How long to wait for a connection attempt to succeed (ms)

            // Note: Keep '?pgbouncer=true' in your SUPABASE_DB_URL if connecting
            // through Supabase's connection pooler (recommended).
        });

        // *** Test the connection by acquiring a client and immediately releasing it ***
        // This ensures the pool can establish at least one connection.
        console.log("Attempting to acquire Supabase test client...");
        const client = await pool.connect();
        console.log("--> Successfully acquired Supabase test client.");
        client.release(); // IMPORTANT: Always release the client back to the pool!
        console.log("--> Test client released.");

        console.log("✅ Supabase PostgreSQL Pool Connected and Ready");

        // Return the pool object. Other parts of your app will use this pool
        // to run queries (e.g., pool.query('SELECT * FROM users'))
        return pool;

    } catch (error) {
        console.error("❌ Supabase Connection Error:", error); // Log the full error

        // *** Add specific hint for ENETUNREACH ***
        if (error.code === 'ENETUNREACH') {
            console.error("💡 Hint: Network Unreachable error often indicates an IPv6 connection issue.");
            console.error("   - Check if the server's network environment has proper IPv6 routing configured.");
            console.error("   - The 'family: 4' option was used to attempt forcing IPv4, which might resolve this.");
            console.error("   - Verify the hostname 'db.ovcqsnqyjjubhjgksjvr.supabase.co' is correct.");
            console.error("   - Check firewalls (local & network) aren't blocking outgoing connections on port 6543.");
            console.error("   - As a last resort, manually resolve the IPv4 address for the hostname and");
            console.error("     configure the Pool using host/port/user/password directly instead of connectionString.");
        } else {
            // Log the specific error message for other errors
            console.error("   Error Details:", error.message);
        }

        process.exit(1); // Exit if connection fails during startup
    }
};

// Export the connect functions and potentially the pool instance later
module.exports = { connectMongoDB, connectSupabase };