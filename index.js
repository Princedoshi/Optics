const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const { connectMongoDB, connectSupabase } = require("./config/db"); // Assuming connectSupabase now returns the pool
// const { redisClient, connectRedis } = require("./config/redis-client");
const { syncDatabases } = require("./sync"); // Assuming this might need the db connections

// Import Routes
const formRoutes = require("./routes/optics-routes");
const authRoutes = require("./routes/authRoutes");
const statisticsRoutes = require("./routes/statisticRoutes");
const productRoutes = require("./routes/premium/productRoutes");

dotenv.config();

// --- Application Setup ---
const app = express();
app.use(cors());
app.use(bodyParser.json()); // Use bodyParser.json() before routes

// --- Database and Sync Logic ---
let supabasePool; // Variable to hold the Supabase pool

const startServer = async () => {
    try {
        // --- 1. Connect Databases ---
        console.log("Initiating database connections...");
        await connectMongoDB(); // Assuming this handles its own connection logic internally

        // Capture the returned pool from Supabase connection function
        supabasePool = await connectSupabase();
        console.log("Database connections established.");

        // --- 2. Make Supabase Pool Available to Routes via Middleware ---
        // This middleware adds the pool to every incoming request object
        app.use((req, res, next) => {
            if (!supabasePool) {
                console.error("Supabase pool not initialized before request!");
                return res.status(503).json({ message: "Database service unavailable" });
            }
            req.supabase = supabasePool; // Attach pool to request object
            next();
        });
        console.log("Supabase pool attached to request context.");

        // --- 3. Setup API Routes ---
        // Routes should be defined *after* the middleware that attaches the pool
        app.use("/api/forms", formRoutes);
        app.use("/api/auth", authRoutes);
        app.use("/api/statistics", statisticsRoutes);
        app.use("/api/premium", productRoutes);

        // Basic API health check route
        app.get("/api", (req, res) => {
            res.status(200).json({ message: "API working fine" });
        });

        // Example DB Clear Route (Keep for dev, remove/secure for prod)
        app.delete("/api/clear-mongo-db", async (req, res) => {
            try {
                const collections = await mongoose.connection.db.listCollections().toArray();
                let deletedCounts = {};
                console.warn("⚠️ WARNING: Clearing MongoDB collections...");
                for (let collection of collections) {
                    const result = await mongoose.connection.db.collection(collection.name).deleteMany({});
                    deletedCounts[collection.name] = result.deletedCount;
                    console.log(`   - Cleared ${result.deletedCount} documents from ${collection.name}`);
                }
                console.warn("✅ MongoDB Cleared.");
                return res.json({ message: "All MongoDB documents deleted", deletedCounts });
            } catch (error) {
                console.error("❌ Error clearing MongoDB database:", error);
                return res.status(500).json({ message: "Error clearing MongoDB database", error: error.message });
            }
        });
        // Add a similar one for Supabase if needed, using req.supabase

        console.log("API routes configured.");

        // --- 4. Run Sync Process (Optional) ---
        // Run this after connections are ready and potentially *before* listening,
        // or run it in the background after listening starts if it's non-critical/long-running.
        // Assuming it needs the connections and should run at startup:
        console.log("Starting database synchronization...");
        // If syncDatabases is async and returns a promise:
        // await syncDatabases(supabasePool, mongoose.connection); // Pass connections if needed
        // If it's synchronous or runs independently:
        syncDatabases(); // Pass connections if needed: syncDatabases(supabasePool, mongoose.connection);
        console.log("Database synchronization process initiated.");

        // --- 5. Start Listening ---
        const PORT = process.env.PORT || 1000;
        app.listen(PORT, () => console.log(`\n🚀 Server is running on port ${PORT}\n`));

    } catch (error) {
        console.error("❌ Failed to start server:", error);
        // Ensure Supabase pool is closed if partially initialized on error
        if (supabasePool) {
            try {
                await supabasePool.end(); // Gracefully close pool
                console.log("Supabase pool closed due to startup error.");
            } catch (poolError) {
                console.error("Error closing Supabase pool during shutdown:", poolError);
            }
        }
        process.exit(1); // Exit if critical setup fails
    }
};

// --- Execute Server Start ---
startServer();