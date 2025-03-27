const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    customerName: { type: String, required: true },
    customerContact: { type: String, required: true },
    message: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    formDataId: { type: mongoose.Schema.Types.ObjectId, ref: 'FormData', required: true }, // Reference to FormData _id
}, { timestamps: true });

const FeedbackModel = mongoose.model('Feedback', feedbackSchema);
module.exports = FeedbackModel;
