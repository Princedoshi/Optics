const mongoose = require("mongoose");

const FormDataSchema = new mongoose.Schema({
  billNo: { type: Number, required: true },
  name: { type: String, required: true },
  contact: { type: String, required: true },
  date: { type: String, required: true },
  frame: { type: String },
  glass: { type: String },
  contactLens: { type: String },

  // NEW FIELD FOR CONTACT LENS DURATION
  contactLensDuration: {
    type: String,
    enum: ["daily", "weekly", "monthly", "3-monthly", "6-monthly", "yearly", "other"],
  },

  framePrice: { type: String },
  glassPrice: { type: String },
  contactLensPrice: { type: String },
  advance: { type: String },
  balance: { type: String },
  total: { type: String, required: true },
  paymentStatus: {
    type: String,
    enum: ["pending", "completed", "paid"],
    required: true,
    default: "pending",
  },
  paymentType: {
    type: String,
    enum: ["cash", "card", "UPI", "cheque", "other"],
  },
  prescription: {
    dist: {
      rightSph: { type: String },
      rightCyl: { type: String },
      rightAxis: { type: String },
      leftSph: { type: String },
      leftCyl: { type: String },
      leftAxis: { type: String },
    },
    near: {
      rightSph: { type: String },
      rightCyl: { type: String },
      rightAxis: { type: String },
      leftSph: { type: String },
      leftCyl: { type: String },
      leftAxis: { type: String },
    },
    notes: { type: String },
  },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
  salesmanId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

const FormDataModel = mongoose.model("FormData", FormDataSchema);
module.exports = FormDataModel;
