const FormDataModel = require("../models/optics-model");


// @desc    Add Form Data
// @route   POST /api/forms/add-form
const addFormData = async (req, res) => {
    try {
        const newFormData = new FormDataModel(req.body);
        await newFormData.save();
        res.status(201).json({ message: "Data saved successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Failed to save data" });
    }
};

module.exports = { addFormData };


// @desc    Get All Form Data
// @route   GET /api/forms
const getAllFormData = async (req, res) => {
    try {
        const allData = await FormDataModel.find(); // Retrieve all records
        res.status(200).json(allData);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve data" });
    }
};

module.exports = { addFormData, getAllFormData };