const FeedbackModel = require("../models/feedbackModel");
const mongoose = require("mongoose");

// Submit feedback
exports.submitFeedback = async (req, res) => {
    try {
        const { formDataId, branchId, message, rating, customerName, customerContact } = req.body;

        // Validate formDataId and branchId formats
        if (!mongoose.Types.ObjectId.isValid(formDataId) || !mongoose.Types.ObjectId.isValid(branchId)) {
            return res.status(400).json({ error: "Invalid formDataId or branchId" });
        }

        if (!customerName || !customerContact) {
            return res.status(400).json({ error: "Customer name and contact are required" });
        }

        // Check if feedback already exists for this formDataId
        const existingFeedback = await FeedbackModel.findOne({ formDataId }).lean().exec();
        if (existingFeedback) {
            return res.status(400).json({ error: "Feedback already submitted for this bill!" });
        }

        // Save new feedback
        const feedback = new FeedbackModel({
            message,
            rating,
            branchId,
            formDataId,
            customerName,
            customerContact, // Include these fields
        });

        await feedback.save();
        res.status(201).json({ success: true, message: "Feedback submitted successfully" });

    } catch (error) {
        console.error("Error in submitFeedback:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


// Get feedback by branch
exports.getFeedbackByBranch = async (req, res) => {
    try {
        const { branchId } = req.params;

        // Validate branchId format
        if (!mongoose.Types.ObjectId.isValid(branchId)) {
            return res.status(400).json({ error: "Invalid branchId" });
        }

        const feedbacks = await FeedbackModel.find({ branchId }).sort({ createdAt: -1 }).lean().exec();
        res.json(feedbacks);
    } catch (error) {
        console.error("Error in getFeedbackByBranch:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Get feedback by specific FormData ID
exports.getFeedbackByFormData = async (req, res) => {
    try {
        const { formDataId } = req.params;

        // Validate formDataId format
        if (!mongoose.Types.ObjectId.isValid(formDataId)) {
            return res.status(400).json({ error: "Invalid formDataId" });
        }

        const feedback = await FeedbackModel.findOne({ formDataId }).lean().exec();
        if (!feedback) {
            return res.status(404).json({ error: "No feedback found for this bill" });
        }

        res.json(feedback);
    } catch (error) {
        console.error("Error in getFeedbackByFormData:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
