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
        console.error(error)
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
        console.log("req.params", req.params);
        console.log("req.body", req.body);
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


const makePartialPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { amountPaid } = req.body;

        if (amountPaid <= 0) {
            return res.status(400).json({ message: "Amount paid must be greater than zero." });
        }

        const purchase = await PurchaseHistoryModel.findOne({ purchaseId: id });

        if (!purchase) {
            return res.status(404).json({ message: "Purchase not found" });
        }

        if (purchase.paymentStatus === "Paid") {
            return res.status(400).json({ message: "This purchase is already fully paid." });
        }

        if (amountPaid > purchase.balanceDue) {
            return res.status(400).json({ message: "Amount paid cannot exceed the remaining balance." });
        }

        const parsedAmountPaid = parseFloat(amountPaid);

        const existingAdvancePaid = parseFloat(purchase.advancePaid);

        const newAdvancePaid = existingAdvancePaid + parsedAmountPaid;
        let newBalanceDue = purchase.balanceDue - parsedAmountPaid;

        let newPaymentStatus = purchase.paymentStatus;
        if (newBalanceDue <= 0) {
            newPaymentStatus = "Paid";
             newBalanceDue = 0;
        } else {
            newPaymentStatus = "Partial";
        }

        const updatedPurchase = await PurchaseHistoryModel.findOneAndUpdate(
            { purchaseId: id },
            {
                $set: {
                    advancePaid: newAdvancePaid,
                    balanceDue: newBalanceDue,
                    paymentStatus: newPaymentStatus
                }
            },
            { new: true }
        );

        res.status(200).json({ message: "Payment recorded successfully", purchase: updatedPurchase });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error recording partial payment", error: error.message });
    }
};



module.exports = {
    createPurchase,
    getAllPurchases,
    getPurchaseById,
    updatePaymentStatus,
    makePartialPayment
};