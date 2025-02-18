const FormDataModel = require("../models/optics-model");
const NodeCache = require("node-cache");

const cache = new NodeCache({ stdTTL: 3600 }); // Cache expires after 1 hour

console.log("Node Cache initialized");

const checkCacheConnection = () => {
    console.log("Checking Node Cache...");
    try {
        cache.set("testKey", "testValue");
        if (cache.get("testKey") === "testValue") {
            console.log("Node Cache is working correctly");
            return true;
        }
    } catch (error) {
        console.error("Node Cache error:", error);
        return false;
    }
};

checkCacheConnection();


const getAllFormData = async (req, res) => {
    try {
        const cachedData = cache.get("allData");

        if (cachedData) {
            console.log("Returning data from cache");
            return res.status(200).json(cachedData);
        } else {
            console.log("Fetching data from the database");
            const allData = await FormDataModel.find();
            
            // Convert Mongoose documents to plain objects before caching
            const plainData = JSON.parse(JSON.stringify(allData));

            cache.set("allData", plainData);
            console.log("Data cached in Node Cache");

            return res.status(200).json(plainData);
        }
    } catch (error) {
        console.error("Error fetching all form data:", error);
        res.status(500).json({ error: "Failed to retrieve data" });
    }
};

const createFormData = async (req, res) => {
    try {
        const lastEntry = await FormDataModel.findOne().sort({ billNo: -1 });

        const newBillNo = lastEntry && !isNaN(lastEntry.billNo) ? lastEntry.billNo + 1 : 1;

        const newFormData = new FormDataModel({
            billNo: newBillNo,
            ...req.body,
        });

        await newFormData.save();

        // Invalidate cache after new data is added
        cache.del("allData");
        console.log("Cache invalidated for allData");

        res.status(201).json({ success: true, data: newFormData });
    } catch (error) {
        console.error("Error creating form entry:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const getFormDataByBillNo = async (req, res) => {
    try {
        const billNo = parseInt(req.params.billNo, 10);
        if (isNaN(billNo)) {
            return res.status(400).json({ success: false, error: "Invalid bill number" });
        }

        const cacheKey = `billNo_${billNo}`;
        const cachedFormData = cache.get(cacheKey);

        if (cachedFormData) {
            console.log(`Returning cached data for billNo ${billNo}`);
            return res.status(200).json({ success: true, data: cachedFormData });
        }

        const formData = await FormDataModel.findOne({ billNo });

        if (!formData) {
            return res.status(404).json({ success: false, error: "Form data not found" });
        }

        cache.set(cacheKey, formData);
        console.log(`Data cached for billNo ${billNo}`);

        res.status(200).json({ success: true, data: formData });
    } catch (error) {
        console.error("Error fetching form entry:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { createFormData, getAllFormData, getFormDataByBillNo };
