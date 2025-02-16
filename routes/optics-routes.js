const express = require("express");
const { createFormData,getAllFormData,getFormDataByBillNo } = require("../controllers/optics-controllers");

const router = express.Router();

router.post("/add-form", createFormData);
router.get("/get-data", getAllFormData);
router.get("/get-data/:billNo", getFormDataByBillNo); // New route




module.exports = router;

