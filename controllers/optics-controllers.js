const FormDataModel = require("../models/optics-model");

const getAllFormData = async (req, res) => {
    try {
        const allData = await FormDataModel.find();
        const plainData = JSON.parse(JSON.stringify(allData));
        return res.status(200).json(plainData);
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
};

const getPendingPayments = async (req, res) => {
    try {
        const pendingData = await FormDataModel.find({ paymentStatus: "pending" });
        const plainData = JSON.parse(JSON.stringify(pendingData));
        return res.status(200).json(plainData);
    } catch (error) {
        console.error("Error fetching pending payment data:", error);
        res.status(500).json({ error: "Failed to retrieve pending payment data" });
    }
};

const updatePendingStatus = async (req, res) => {
    try {
        const billNo = parseInt(req.params.billNo, 10);
        if (isNaN(billNo)) {
            return res.status(400).json({ success: false, error: "Invalid bill number" });
        }

        const updatedForm = await FormDataModel.findOneAndUpdate(
            { billNo, paymentStatus: "pending" }, 
            { paymentStatus: "paid" }, // Update status to "paid"
            { new: true } // Return updated document
        );

        if (!updatedForm) {
            return res.status(404).json({ success: false, error: "Pending payment not found" });
        }

        res.status(200).json({ success: true, message: "Payment status updated to paid", data: updatedForm });
    } catch (error) {
        console.error("Error updating payment status:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

const getPendingPaymentByBillNo = async (req, res) => {
    try {
        const billNo = parseInt(req.params.billNo, 10);
        if (isNaN(billNo)) {
            return res.status(400).json({ success: false, error: "Invalid bill number" });
        }

        const pendingPayment = await FormDataModel.findOne({ billNo, paymentStatus: "pending" });

        if (!pendingPayment) {
            return res.status(404).json({ success: false, error: "No pending payment found for this bill number" });
        }

        res.status(200).json({ success: true, data: pendingPayment });
    } catch (error) {
        console.error("Error fetching pending payment by billNo:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};



module.exports = { createFormData, getAllFormData, getFormDataByBillNo ,getPendingPayments,updatePendingStatus,getPendingPaymentByBillNo};
