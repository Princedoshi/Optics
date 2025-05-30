const FormDataModel = require("../models/optics-model");
const mongoose = require('mongoose');
const _ = require('lodash');

const getAllFormData = async (req, res) => {
    try {
        const { branchIds } = req.user;
        const filter = { branchId: { $in: branchIds } };
        const allData = await FormDataModel.find(filter);
        res.status(200).json(allData);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve data" });
    }
};

const createFormData = async (req, res) => {
    try {
        const { branchIds } = req.user;
        const userBranchId = req.body.branchId;

        if (!userBranchId) {
             return res.status(400).json({ success: false, error: "Branch ID is missing in the request body." });
        }

        if (!branchIds.includes(userBranchId)) {
            return res.status(403).json({ success: false, error: "Unauthorized branch access" });
        }

        const lastEntryForBranch = await FormDataModel.findOne({ branchId: userBranchId }).sort({ billNo: -1 });
        let newBillNo;
        if (lastEntryForBranch && !isNaN(lastEntryForBranch.billNo)) {
            newBillNo = lastEntryForBranch.billNo + 1;
        } else {
            newBillNo = 1;
        }

        const newFormData = new FormDataModel({
            billNo: newBillNo,
            ...req.body,
        });

        await newFormData.save();

        res.status(201).json({ success: true, data: newFormData });

    } catch (error) {
        if (error.name === 'ValidationError') {
             return res.status(400).json({ success: false, error: "Validation failed", details: error.errors });
        }
        res.status(500).json({ success: false, error: "Failed to create form entry.", details: error.message });
    }
};

const getFormDataByBillNo = async (req, res) => {
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
        res.status(500).json({ success: false, error: error.message });
    }
};


const getPendingPayments = async (req, res) => {
    try {
        const { branchIds } = req.user;
        const filter = { paymentStatus: "pending", branchId: { $in: branchIds } };
        const pendingData = await FormDataModel.find(filter);
        res.status(200).json(pendingData);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve pending payment data" });
    }
};


const updatePendingStatus = async (req, res) => {
    try {
        const { branchIds } = req.user;
        const billNo = parseInt(req.params.billNo, 10);
        const { paymentType } = req.body;

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
        res.status(500).json({ success: false, error: error.message });
    }
};


const getPendingPaymentById = async (req, res) => {
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
        res.status(500).json({ success: false, error: error.message });
    }
};

const updateFormData = async (req, res) => {
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
        res.status(500).json({ success: false, error: error.message });
    }
};

const getExpiringContactLenses = async (req, res) => {
    try {
        const { branchIds } = req.user;
        const { daysThreshold = 14 } = req.query;

        const threshold = parseInt(daysThreshold, 10);
        if (isNaN(threshold) || threshold <= 0) {
            return res.status(400).json({ success: false, error: "Invalid daysThreshold parameter. Must be a positive number." });
        }

        const now = new Date();

        const calculableDurations = ["daily", "weekly", "monthly", "3-monthly", "6-monthly", "yearly"];

        const pipeline = [
            {
                $match: {
                    branchId: { $in: branchIds.map(id => new mongoose.Types.ObjectId(id)) },
                    contactLens: { $exists: true, $ne: null, $ne: "" },
                    contactLensDuration: { $in: calculableDurations },
                    createdAt: { $exists: true }
                }
            },
            {
                $addFields: {
                    expiryDate: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$contactLensDuration", "daily"] }, then: { $dateAdd: { startDate: "$createdAt", unit: "day", amount: 1 } } },
                                { case: { $eq: ["$contactLensDuration", "weekly"] }, then: { $dateAdd: { startDate: "$createdAt", unit: "week", amount: 1 } } },
                                { case: { $eq: ["$contactLensDuration", "monthly"] }, then: { $dateAdd: { startDate: "$createdAt", unit: "month", amount: 1 } } },
                                { case: { $eq: ["$contactLensDuration", "3-monthly"] }, then: { $dateAdd: { startDate: "$createdAt", unit: "month", amount: 3 } } },
                                { case: { $eq: ["$contactLensDuration", "6-monthly"] }, then: { $dateAdd: { startDate: "$createdAt", unit: "month", amount: 6 } } },
                                { case: { $eq: ["$contactLensDuration", "yearly"] }, then: { $dateAdd: { startDate: "$createdAt", unit: "year", amount: 1 } } }
                            ],
                            default: null
                        }
                    }
                }
            },
            {
                $match: {
                    expiryDate: {
                        $ne: null,
                        $gte: now,
                        $lte: new Date(now.getTime() + threshold * 24 * 60 * 60 * 1000)
                    }
                }
            },
            {
                $project: {
                    _id: 1, billNo: 1, name: 1, contact: 1, createdAt: 1,
                    contactLens: 1, contactLensDuration: 1, expiryDate: 1, branchId: 1,
                }
            },
            {
                $sort: { expiryDate: 1 }
            }
        ];

        const expiringOrders = await FormDataModel.aggregate(pipeline);

        res.status(200).json({ success: true, count: expiringOrders.length, data: expiringOrders });

    } catch (error) {
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