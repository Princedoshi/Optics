const express = require("express");
const { addFormData,getAllFormData } = require("../controllers/optics-controllers");

const router = express.Router();

router.post("/add-form", addFormData);
router.get("/get-data", getAllFormData);



module.exports = router;

