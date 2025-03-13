const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const mongoose = require("mongoose"); // Import Mongoose
const connectDB = require("./config/db");
const formRoutes = require("./routes/optics-routes");
const authRoutes = require("./routes/authRoutes");
const statisticsRoutes = require("./routes/statisticRoutes");

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 1000;

app.use(cors());
app.use(bodyParser.json());

app.use("/api/forms", formRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/statistics",statisticsRoutes);


app.delete("/api/clear-db", async (req, res) => {
    try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        let deletedCounts = {};

        for (let collection of collections) {
            const result = await mongoose.connection.db.collection(collection.name).deleteMany({});
            deletedCounts[collection.name] = result.deletedCount;
        }

        return res.json({ message: "All documents deleted", deletedCounts });
    } catch (error) {
        console.error("Error clearing database:", error);
        return res.status(500).json({ message: "Error clearing database", error });
    }
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
