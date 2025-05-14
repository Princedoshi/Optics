const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const { connectMongoDB } = require("./config/db"); 
const { syncDatabases } = require("./sync");

// Import Routes
const formRoutes = require("./routes/optics-routes");
const authRoutes = require("./routes/authRoutes");
const statisticsRoutes = require("./routes/statisticRoutes");

dotenv.config();

// --- Application Setup ---
const app = express();
app.use(cors());
app.use(bodyParser.json()); // Use bodyParser.json() before routes



const startServer = async () => {
    try {
        await connectMongoDB();
        app.use("/api/forms", formRoutes);
        app.use("/api/auth", authRoutes);
        app.use("/api/statistics", statisticsRoutes);

        syncDatabases(); // If needed

        const PORT = process.env.PORT || 1000;
        app.listen(PORT, () => console.log(`🚀 Server is running on port ${PORT}`));

    } catch (error) {
        console.error("❌ Server startup failed:", error);
        process.exit(1);
    }
};


// --- Execute Server Start ---
startServer();