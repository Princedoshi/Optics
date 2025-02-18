const FormDataModel = require("../models/optics-model");
const Memcached = require("memcached");


const cache = new Memcached(``, {
    username: process.env.MEMCACHED_USERNAME,
    password: process.env.MEMCACHED_PASSWORD,
});

const checkMemcachedConnection = () => {
    return new Promise((resolve, reject) => {
        cache.stats((err, stats) => {
            if (err) {
                console.error("Memcached connection failed:", err);
                reject(false);
            } else {
                console.log("Memcached connected successfully:", stats);
                resolve(true);
            }
        });
    });
};

// Example usage:
checkMemcachedConnection()
    .then(() => console.log("Memcached is up and running!"))
    .catch(() => console.log("Memcached is not available."));


const getAllFormData = async (req, res) => {
    try {
        const getCacheData = (key) => {
            return new Promise((resolve, reject) => {
                cache.get(key, (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                });
            });
        };

        const cachedData = await getCacheData("allData");
        
        if (cachedData) {
            console.log("Returning data from cache");
            return res.status(200).json(JSON.parse(cachedData));
        } else {
            console.log("Fetching data from the database");
            const allData = await FormDataModel.find();
            cache.set("allData", JSON.stringify(allData), 3600, (err) => {
                if (err) {
                    console.error("Error caching data:", err);
                }
                console.log("Data cached in Memcached");
            });

            return res.status(200).json(allData);
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
        cache.del("allData", (err) => {
            if (err) {
                console.error("Error deleting cache:", err);
            } else {
                console.log("Cache invalidated for allData");
            }
        });

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

