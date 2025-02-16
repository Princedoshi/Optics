const FormDataModel = require("../models/optics-model");

// @desc    Create Form Data with Auto Incrementing Bill Number
// @route   POST /api/forms/add-form
const createFormData = async (req, res) => {
    try {
        const lastEntry = await FormDataModel.findOne().sort({ billNo: -1 });

        const newBillNo = lastEntry && !isNaN(lastEntry.billNo) ? lastEntry.billNo + 1 : 1;

        const newFormData = new FormDataModel({
            billNo: newBillNo,
            ...req.body,
        });

        await newFormData.save();
        res.status(201).json({ success: true, data: newFormData });
    } catch (error) {
        console.error("Error creating form entry:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};


// @desc    Get All Form Data
// @route   GET /api/forms/get-data
const getAllFormData = async (req, res) => {
    try {
        const allData = await FormDataModel.find(); // Retrieve all records
        res.status(200).json(allData);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve data" });
    }
};


const getFormDataByBillNo = async (req, res) => {
    try {
        const billNo = parseInt(req.params.billNo, 10); // Convert billNo to a number
        if (isNaN(billNo)) {
            return res.status(400).json({ success: false, error: "Invalid bill number" });
        }

        const formData = await FormDataModel.findOne({ billNo });

        if (!formData) {
            return res.status(404).json({ success: false, error: "Form data not found" });
        }

        res.status(200).json({ success: true, data: formData });
    } catch (error) {
        console.error("Error fetching form entry:", error);
        res.status(500).json({ success: false, error: error.message });
    }
}


module.exports = { createFormData, getAllFormData , getFormDataByBillNo};

