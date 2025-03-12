const FormDataModel = require("../models/optics-model");

const getAllFormData = async (req, res) => {
    try {
        const { role, branchIds } = req.user;
        const filter = role === "owner" ? {} : { branchId: { $in: branchIds } };

        const allData = await FormDataModel.find(filter);
        res.status(200).json(allData);
    } catch (error) {
        console.error("Error fetching form data:", error);
        res.status(500).json({ error: "Failed to retrieve data" });
    }
};

const createFormData = async (req, res) => {
    try {
        const { role, branchIds } = req.user;
        const userBranchId = req.body.branchId;

        // Restrict non-owners to create only in their allowed branches
        if (role !== "owner" && !branchIds.includes(userBranchId)) {
            return res.status(403).json({ success: false, error: "Unauthorized branch access" });
        }

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

const getFormDataByBillNo = async (req, res) => {
    try {
        const { role, branchIds } = req.user;
        const billNo = parseInt(req.params.billNo, 10);
        if (isNaN(billNo)) {
            return res.status(400).json({ success: false, error: "Invalid bill number" });
        }

        const filter = { billNo };
        if (role !== "owner") filter.branchId = { $in: branchIds };

        const formData = await FormDataModel.findOne(filter);

        if (!formData) {
            return res.status(404).json({ success: false, error: "Form data not found" });
        }

        res.status(200).json({ success: true, data: formData });
    } catch (error) {
        console.error("Error fetching form entry:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const getPendingPayments = async (req, res) => {
    try {
        const { role, branchIds } = req.user;
        // console.log("Role:", role, "BranchIds:", branchIds);
        const filter = role === "owner"
            ? { paymentStatus: "pending" }
            : { paymentStatus: "pending", branchId: { $in: branchIds } };

        const pendingData = await FormDataModel.find(filter);
        const plainData = JSON.parse(JSON.stringify(pendingData));
        return res.status(200).json(plainData);
    } catch (error) {
        console.error("Error fetching pending payment data:", error);
        res.status(500).json({ error: "Failed to retrieve pending payment data" });
    }
};

const updatePendingStatus = async (req, res) => {
    try {
        const { role, branchIds } = req.user;
        const billNo = parseInt(req.params.billNo, 10);
        if (isNaN(billNo)) {
            return res.status(400).json({ success: false, error: "Invalid bill number" });
        }

        const filter = {
            billNo,
            paymentStatus: "pending",
        };

        if (role !== "owner") {
            filter.branchId = { $in: branchIds };
        }

        const updatedForm = await FormDataModel.findOneAndUpdate(
            filter,
            { paymentStatus: "paid" },
            { new: true }
        );

        if (!updatedForm) {
            return res.status(404).json({ success: false, error: "Pending payment not found or unauthorized" });
        }

        res.status(200).json({ success: true, message: "Payment status updated to paid", data: updatedForm });
    } catch (error) {
        console.error("Error updating payment status:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const getPendingPaymentByBillNo = async (req, res) => {
    try {
        const { role, branchIds } = req.user;
        const billNo = parseInt(req.params.billNo, 10);
        if (isNaN(billNo)) {
            return res.status(400).json({ success: false, error: "Invalid bill number" });
        }

        const filter = { billNo, paymentStatus: "pending" };
        if (role !== "owner") filter.branchId = { $in: branchIds };

        const pendingPayment = await FormDataModel.findOne(filter);

        if (!pendingPayment) {
            return res.status(404).json({ success: false, error: "No pending payment found or unauthorized access" });
        }

        res.status(200).json({ success: true, data: pendingPayment });
    } catch (error) {
        console.error("Error fetching pending payment by billNo:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    createFormData,
    getAllFormData,
    getFormDataByBillNo,
    getPendingPayments,
    updatePendingStatus,
    getPendingPaymentByBillNo,
};
