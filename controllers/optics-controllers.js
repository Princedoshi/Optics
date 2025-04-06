const FormDataModel = require("../models/optics-model");
const mongoose = require('mongoose'); // Import mongoose
const _ = require('lodash');


const getAllFormData = async (req, res) => {
    try {
        const { branchIds } = req.user;
        const filter = { branchId: { $in: branchIds } };
        const allData = await FormDataModel.find(filter);

        console.log("Fetching allFormData from DB");
        res.status(200).json(allData);
    } catch (error) {
        console.error("Error fetching form data:", error);
        res.status(500).json({ error: "Failed to retrieve data" });
    }
};

const createFormData = async (req, res) => {
    try {
        const { branchIds } = req.user;
        const userBranchId = req.body.branchId;

        // --- Step 1: Log the incoming request body ---
        // This is crucial to verify if 'contactLensDuration' is being received.
        console.log("--- createFormData ---");
        console.log("Received req.body:", JSON.stringify(req.body, null, 2));
        console.log("req.body.contactLensDuration:", req.body.contactLensDuration); // Log the specific field

        // Check if branchId is provided in the body
        if (!userBranchId) {
             return res.status(400).json({ success: false, error: "Branch ID is missing in the request body." });
        }

        // Restrict creation to allowed branches
        if (!branchIds.includes(userBranchId)) {
            console.warn(`Unauthorized branch access attempt: User branches [${branchIds.join(', ')}], Requested branch ${userBranchId}`);
            return res.status(403).json({ success: false, error: "Unauthorized branch access" });
        }

        // Find the last entry for the specific branch
        const lastEntryForBranch = await FormDataModel.findOne({ branchId: userBranchId }).sort({ billNo: -1 });

        // Determine the new bill number based on the branch's last entry
        let newBillNo;
        if (lastEntryForBranch && !isNaN(lastEntryForBranch.billNo)) {
            newBillNo = lastEntryForBranch.billNo + 1;
        } else {
            // If no entries for the branch, start at 1
            newBillNo = 1;
            console.log(`No previous entries found for branch ${userBranchId}. Starting bill number at 1.`);
        }
        console.log(`Assigning new bill number: ${newBillNo} for branch ${userBranchId}`);

        // --- Step 2: Create the Mongoose document ---
        // The spread (...) operator should include all fields from req.body
        // *IF* they are defined in the FormDataSchema.
        const newFormData = new FormDataModel({
            billNo: newBillNo,
            ...req.body, // Spreads all properties from req.body
        });

        // --- Step 3: Log the document BEFORE saving ---
        // This shows what Mongoose attempts to save (it includes fields defined in schema).
        console.log("Mongoose document BEFORE save:", JSON.stringify(newFormData.toObject(), null, 2));

        // --- Step 4: Save the document ---
        await newFormData.save(); // Mongoose validation and saving happen here

        // --- Step 5: Log the document AFTER saving ---
        // This shows the final data saved in the database.
        console.log("Mongoose document AFTER save:", JSON.stringify(newFormData.toObject(), null, 2));
        console.log("--- createFormData successful ---");


        res.status(201).json({ success: true, data: newFormData });

    } catch (error) {
        console.error("--- Error in createFormData ---");
        console.error("Error details:", error);

        // Provide more detail for validation errors
        if (error.name === 'ValidationError') {
             console.error("Validation Errors:", JSON.stringify(error.errors, null, 2));
             // Return validation errors to the client
             return res.status(400).json({ success: false, error: "Validation failed", details: error.errors });
        }

        res.status(500).json({ success: false, error: "Failed to create form entry.", details: error.message });
    }
};

const getFormDataByBillNo = async (req, res) => { // No Cache
    const { branchIds } = req.user;
    const billNo = parseInt(req.params.billNo, 10);
    if (isNaN(billNo)) {
        return res.status(400).json({ success: false, error: "Invalid bill number" });
    }

    try {
        const filter = { billNo, branchId: { $in: branchIds } };
        const formData = await FormDataModel.findOne(filter);

        if (!formData) {
            return res.status(404).json({ success: false, error: "Form data not found or unauthorized" });
        }

        res.status(200).json({ success: true, data: formData });
    } catch (error) {
        console.error("Error fetching form entry:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};


const getPendingPayments = async (req, res) => { // No Cache
    try {
        const { branchIds } = req.user;
        const filter = { paymentStatus: "pending", branchId: { $in: branchIds } };
        const pendingData = await FormDataModel.find(filter);
        res.status(200).json(pendingData);
    } catch (error) {
        console.error("Error fetching pending payment data:", error);
        res.status(500).json({ error: "Failed to retrieve pending payment data" });
    }
};


const updatePendingStatus = async (req, res) => { // No Cache
    try {
        const { branchIds } = req.user;
        const billNo = parseInt(req.params.billNo, 10);
        const { paymentType } = req.body; // Get paymentType from request body
        console.log("Payment Type:", paymentType);

        if (isNaN(billNo)) {
            return res.status(400).json({ success: false, error: "Invalid bill number" });
        }

        if (!paymentType || !["Cash", "Card", "UPI", "Cheque", "other"].includes(paymentType)) {
            return res.status(400).json({ success: false, error: "Invalid or missing payment type" });
        }

        const filter = {
            billNo,
            paymentStatus: "pending",
            branchId: { $in: branchIds }
        };

        const updatedForm = await FormDataModel.findOneAndUpdate(
            filter,
            { paymentStatus: "completed", paymentType },
            { new: true }
        );

        if (!updatedForm) {
            return res.status(404).json({ success: false, error: "Pending payment not found or unauthorized" });
        }

        res.status(200).json({ success: true, message: "Payment status updated to completed", data: updatedForm });
    } catch (error) {
        console.error("Error updating payment status:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};


const getPendingPaymentById = async (req, res) => { // No Cache
    const { branchIds } = req.user;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, error: "Invalid order ID" });
    }

    try {
        const filter = {
            _id: id,
            paymentStatus: "pending",
            branchId: { $in: branchIds }
        };

        const pendingPayment = await FormDataModel.findOne(filter);

        if (!pendingPayment) {
            return res.status(404).json({ success: false, error: "No pending payment found or unauthorized access" });
        }

        res.status(200).json({ success: true, data: pendingPayment });
    } catch (error) {
        console.error("Error fetching pending payment by ID:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const updateFormData = async (req, res) => { // No Cache
    try {
        const { branchIds } = req.user;
        const formId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(formId)) {
            return res.status(400).json({ success: false, error: "Invalid Form ID" });
        }

        const filter = {
            _id: formId,
            branchId: { $in: branchIds }
        };

        const allowedFields = [
            'name', 'contact', 'date', 'frame', 'glass', 'contactLens',
            'framePrice', 'glassPrice', 'contactLensPrice', 'advance',
            'paymentStatus',
            'prescription.dist.rightSph', 'prescription.dist.rightCyl', 'prescription.dist.rightAxis',
            'prescription.dist.leftSph', 'prescription.dist.leftCyl', 'prescription.dist.leftAxis',
            'prescription.near.rightSph', 'prescription.near.rightCyl', 'prescription.near.rightAxis',
            'prescription.near.leftSph', 'prescription.near.leftCyl', 'prescription.near.leftAxis',
            'prescription.notes'
        ];

        const updateData = _.pick(req.body, allowedFields);

        const existingData = await FormDataModel.findOne(filter);
        if (!existingData) {
            return res.status(404).json({ success: false, error: "Form data not found or unauthorized" });
        }

        if (
            updateData.hasOwnProperty('framePrice') ||
            updateData.hasOwnProperty('glassPrice') ||
            updateData.hasOwnProperty('contactLensPrice')
        ) {
            const framePrice = parseFloat(updateData.framePrice ?? existingData.framePrice) || 0;
            const glassPrice = parseFloat(updateData.glassPrice ?? existingData.glassPrice) || 0;
            const contactLensPrice = parseFloat(updateData.contactLensPrice ?? existingData.contactLensPrice) || 0;

            if (!isNaN(framePrice) && !isNaN(glassPrice) && !isNaN(contactLensPrice)) {
                updateData.total = (framePrice + glassPrice + contactLensPrice).toString();
            } else {
                return res.status(400).json({ success: false, error: "Prices must be valid numbers." });
            }
        }

        if (updateData.hasOwnProperty('total') || updateData.hasOwnProperty('advance')) {
            const total = parseFloat(updateData.total ?? existingData.total) || 0;
            const advance = parseFloat(updateData.advance ?? existingData.advance) || 0;

            if (!isNaN(total) && !isNaN(advance)) {
                updateData.balance = (total - advance).toString();
            } else {
                return res.status(400).json({ success: false, error: "Total and Advance must be valid numbers." });
            }
        }

        const updatedFormData = await FormDataModel.findOneAndUpdate(filter, updateData, {
            new: true,
            runValidators: true,
        });

        if (!updatedFormData) {
            return res.status(404).json({ success: false, error: "Form data not found or unauthorized" });
        }

        res.status(200).json({ success: true, data: updatedFormData });

    } catch (error) {
        console.error("Error updating form data:", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, error: error.message });
        }
        res.status(500).json({ success: false, error: error.message });
    }
};


const deleteFormData = async (req, res) => {
    try {
        const { branchIds } = req.user;
        const formId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(formId)) {
            return res.status(400).json({ success: false, error: "Invalid Form ID" });
        }

        const filter = {
            _id: formId,
            branchId: { $in: branchIds }
        };

        const deletedFormData = await FormDataModel.findOneAndDelete(filter);

        if (!deletedFormData) {
            return res.status(404).json({ success: false, error: "Form data not found or unauthorized" });
        }

        res.status(200).json({ success: true, message: "Form data deleted successfully" });

    } catch (error) {
        console.error("Error deleting form data:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const getExpiringContactLenses = async (req, res) => {
    try {
        const { branchIds } = req.user;
        const { daysThreshold = 14 } = req.query; // Default to 14 days, allow override via query param

        const threshold = parseInt(daysThreshold, 10);
        if (isNaN(threshold) || threshold <= 0) {
            return res.status(400).json({ success: false, error: "Invalid daysThreshold parameter. Must be a positive number." });
        }

        const now = new Date(); // Current date/time

        // Define the valid durations for calculation (exclude 'other' for now)
        const calculableDurations = ["daily", "weekly", "monthly", "3-monthly", "6-monthly", "yearly"];

        const pipeline = [
            // Stage 1: Initial Match - Filter relevant documents
            {
                $match: {
                    branchId: { $in: branchIds.map(id => new mongoose.Types.ObjectId(id)) }, // Ensure IDs are ObjectIds for matching
                    contactLens: { $exists: true, $ne: null, $ne: "" }, // Must have contact lens value
                    contactLensDuration: { $in: calculableDurations }, // Must have a calculable duration
                    createdAt: { $exists: true } // Ensure createdAt exists (should always with timestamps: true)
                }
            },
            // Stage 2: Add Expiry Date Field
            {
                $addFields: {
                    expiryDate: {
                        $switch: {
                            branches: [
                                {
                                    case: { $eq: ["$contactLensDuration", "daily"] },
                                    then: { $dateAdd: { startDate: "$createdAt", unit: "day", amount: 1 } }
                                },
                                {
                                    case: { $eq: ["$contactLensDuration", "weekly"] },
                                    then: { $dateAdd: { startDate: "$createdAt", unit: "week", amount: 1 } }
                                },
                                {
                                    case: { $eq: ["$contactLensDuration", "monthly"] },
                                    then: { $dateAdd: { startDate: "$createdAt", unit: "month", amount: 1 } }
                                },
                                {
                                    case: { $eq: ["$contactLensDuration", "3-monthly"] },
                                    then: { $dateAdd: { startDate: "$createdAt", unit: "month", amount: 3 } }
                                },
                                {
                                    case: { $eq: ["$contactLensDuration", "6-monthly"] },
                                    then: { $dateAdd: { startDate: "$createdAt", unit: "month", amount: 6 } }
                                },
                                {
                                    case: { $eq: ["$contactLensDuration", "yearly"] },
                                    then: { $dateAdd: { startDate: "$createdAt", unit: "year", amount: 1 } }
                                }
                            ],
                            // Should not happen due to initial $match, but provides a fallback
                            default: null
                        }
                    }
                }
            },
            // Stage 3: Filter based on calculated Expiry Date
            {
                $match: {
                    expiryDate: {
                        $ne: null, // Ensure expiryDate was calculated
                        $gte: now, // Expiry date must be now or in the future (not already expired)
                        $lte: new Date(now.getTime() + threshold * 24 * 60 * 60 * 1000) // Expiry date must be within the threshold period from now
                    }
                }
            },
            // Stage 4: (Optional) Project only necessary fields
            {
                $project: {
                    _id: 1,
                    billNo: 1,
                    name: 1,
                    contact: 1,
                    createdAt: 1,
                    contactLens: 1,
                    contactLensDuration: 1,
                    expiryDate: 1, // Include the calculated expiry date
                    branchId: 1,
                    // Add any other fields you want to return
                }
            },
            // Stage 5: (Optional) Sort by expiry date (soonest first)
            {
                $sort: {
                    expiryDate: 1 // 1 for ascending
                }
            }
        ];

        console.log(`Fetching expiring contact lenses within ${threshold} days for branches: ${branchIds.join(', ')}`);
        const expiringOrders = await FormDataModel.aggregate(pipeline);

        res.status(200).json({ success: true, count: expiringOrders.length, data: expiringOrders });

    } catch (error) {
        console.error("Error fetching expiring contact lenses:", error);
        // Specific check for CastError if branchIds aren't valid ObjectIds somehow
        if (error.name === 'CastError') {
             return res.status(400).json({ success: false, error: "Invalid branch ID format." });
        }
        res.status(500).json({ success: false, error: "Failed to retrieve expiring contact lens data", details: error.message });
    }
};


module.exports = {
    createFormData,
    getAllFormData,
    getFormDataByBillNo,
    getPendingPayments,
    updatePendingStatus,
    getPendingPaymentById,
    updateFormData,
    deleteFormData,
    getExpiringContactLenses
};