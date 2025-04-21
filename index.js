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
let supabaseClient;

const startServer = async () => {
    try {
        await connectMongoDB();
        supabaseClient = await connectSupabase();

        app.use((req, res, next) => {
            if (!supabaseClient) {
                return res.status(503).json({ message: "Supabase DB unavailable" });
            }
            req.supabase = supabaseClient;
            next();
        });

        app.use("/api/forms", formRoutes);
        app.use("/api/auth", authRoutes);
        app.use("/api/statistics", statisticsRoutes);
        app.use("/api/premium", productRoutes);

        syncDatabases(); // If needed

        const PORT = process.env.PORT || 1000;
        app.listen(PORT, () => console.log(`🚀 Server is running on port ${PORT}`));

    } catch (error) {
        console.error("❌ Server startup failed:", error);
        if (supabaseClient) {
            try {
                await supabaseClient.end();
                console.log("Supabase client closed.");
            } catch (err) {
                console.error("Error closing Supabase client:", err);
            }
        }
        process.exit(1);
    }
};


// --- Execute Server Start ---
startServer();