const PurchaseHistoryModel = require("../models/purchase-model");


const createPurchase = async (req, res) => {
    try {
        const purchaseCount = await PurchaseHistoryModel.countDocuments();
        const newPurchase = new PurchaseHistoryModel({
            ...req.body,
            purchaseId: purchaseCount + 1,
        });

        await newPurchase.save();
        res.status(201).json({ message: "Purchase recorded successfully", purchase: newPurchase });
    } catch (error) {
        res.status(500).json({ message: "Error creating purchase", error: error.message });
    }
};

const getAllPurchases = async (req, res) => {
    try {
        const purchases = await PurchaseHistoryModel.find();
        res.status(200).json(purchases);
    } catch (error) {
        res.status(500).json({ message: "Error fetching purchases", error: error.message });
    }
};

const getPurchaseById = async (req, res) => {
    try {
        const purchase = await PurchaseHistoryModel.findOne({ purchaseId: req.params.id });
        if (!purchase) {
            return res.status(404).json({ message: "Purchase not found" });
        }
        res.status(200).json(purchase);
    } catch (error) {
        res.status(500).json({ message: "Error fetching purchase", error: error.message });
    }
};

const updatePaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentStatus } = req.body;

        if (!["Paid", "Pending", "Partial"].includes(paymentStatus)) {
            return res.status(400).json({ message: "Invalid payment status" });
        }

        const updatedPurchase = await PurchaseHistoryModel.findOneAndUpdate(
            { purchaseId: id },
            { paymentStatus },
            { new: true }
        );

        if (!updatedPurchase) {
            return res.status(404).json({ message: "Purchase not found" });
        }

        res.status(200).json({ message: "Payment status updated successfully", purchase: updatedPurchase });
    } catch (error) {
        res.status(500).json({ message: "Error updating payment status", error: error.message });
    }
};

module.exports = {
    createPurchase,
    getAllPurchases,
    getPurchaseById,
    updatePaymentStatus
};