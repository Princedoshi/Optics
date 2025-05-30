const PurchaseHistoryModel = require("../models/purchase-model");

const createPurchase = async (req, res) => {
    try {
        const { branchIds } = req.user; // Get branchIds from req.user
        console.log("req.user: ", req.user);

        if (!branchIds || branchIds.length === 0) {
            return res.status(400).json({ success: false, error: "User has no assigned branches" });
        }

        // For now, taking only the first branch ID if the user has multiple assigned.
        const userBranchId = branchIds[0];  // Use branchIds[0] from req.user

        // Find the last purchase for the specific branch
        const lastPurchaseForBranch = await PurchaseHistoryModel.findOne({ branchId: userBranchId }).sort({ purchaseId: -1 });

        // Determine the new purchase ID based on the branch's last entry
        let newPurchaseId;
        if (lastPurchaseForBranch && !isNaN(lastPurchaseForBranch.purchaseId)) {
            newPurchaseId = lastPurchaseForBranch.purchaseId + 1;
        } else {
            // If no purchases for the branch, start at 1
            newPurchaseId = 1;
        }

        const newPurchase = new PurchaseHistoryModel({
            purchaseId: newPurchaseId,
            ...req.body,
            branchId: userBranchId //set branchID to the userBranchId for the branch
        });

        await newPurchase.save();
        res.status(201).json({ success: true, data: newPurchase });
    } catch (error) {
        console.error("Error creating purchase:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const getAllPurchases = async (req, res) => {
    try {
        const { branchIds } = req.user; // Assuming branchIds are available in req.user

        // Construct the filter based on the branchIds
        const filter = { branchId: { $in: branchIds } };

        // Find purchases matching the filter
        const purchases = await PurchaseHistoryModel.find(filter);

        res.status(200).json(purchases);
    } catch (error) {
        console.error("Error fetching purchases:", error);
        res.status(500).json({ message: "Error fetching purchases", error: error.message });
    }
};

const getPurchaseById = async (req, res) => {
    try {
        const { branchIds } = req.user;
        const purchaseId = req.params.id;

        const purchase = await PurchaseHistoryModel.findOne({
            purchaseId: purchaseId,
            branchId: { $in: branchIds }  // Add branchId filter
        });

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
        const { branchIds } = req.user;
        const { id } = req.params;
        const { paymentStatus } = req.body;

        if (!["Paid", "Pending", "Partial"].includes(paymentStatus)) {
            return res.status(400).json({ message: "Invalid payment status" });
        }

        const updatedPurchase = await PurchaseHistoryModel.findOneAndUpdate(
            { purchaseId: id, branchId: { $in: branchIds } },  // Add branchId filter
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
        const { branchIds } = req.user;
        const { id } = req.params;
        const { amountPaid } = req.body;

        if (amountPaid <= 0) {
            return res.status(400).json({ message: "Amount paid must be greater than zero." });
        }

        const purchase = await PurchaseHistoryModel.findOne({ purchaseId: id, branchId: { $in: branchIds } });  // Add branchId filter

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
            { purchaseId: id, branchId: { $in: branchIds } },  // Add branchId filter
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