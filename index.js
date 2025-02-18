const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const formRoutes = require("./routes/optics-routes");
// const whatsappRoutes = require("./routes/whatsapp-routes");
dotenv.config();

connectDB();

const app = express();
const PORT = process.env.PORT || 1000;

app.use(cors());
app.use(bodyParser.json());

app.use("/api/forms", formRoutes);
// app.use("/api/whatsapp", whatsappRoutes);


app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
