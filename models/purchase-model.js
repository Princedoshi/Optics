const mongoose = require("mongoose");

const PurchaseHistorySchema = new mongoose.Schema({
    purchaseId: { type: Number, required: true },  // Keep required: true
    supplierName: { type: String, required: true },
    supplierContact: { type: String },
    date: { type: Date, required: true },
    items: [
        {
            itemName: { type: String, required: true },
            category: { type: String, required: true },
            quantity: { type: Number, required: true },
            unitPrice: { type: Number, required: true },
            totalPrice: { type: Number, required: true }
        }
    ],
    totalAmount: { type: Number, required: true },
    advancePaid: { type: Number, default: 0 },
    balanceDue: { type: Number, required: true },
    paymentStatus: { type: String, enum: ["Paid", "Pending", "Partial"], required: true },
    notes: { type: String },

    // Add branch reference: This is the crucial part.
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },  // Required is important

}, { timestamps: true });

// Add the compound index to enforce uniqueness within each branch
PurchaseHistorySchema.index({ branchId: 1, purchaseId: 1 }, { unique: true });

const PurchaseHistoryModel = mongoose.model("PurchaseHistory", PurchaseHistorySchema);
module.exports = PurchaseHistoryModel;