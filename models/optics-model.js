const mongoose = require("mongoose");

const FormDataSchema = new mongoose.Schema({
  billNo: { type: Number, required: true},
  name: { type: String, required: true },
  contact: { type: String, required: true },
  date: { type: String, required: true },
  frame: { type: String },
  glass: { type: String },
  contactLens: { type: String },
  framePrice: { type: String }, // Added framePrice
  glassPrice: { type: String }, // Added glassPrice
  contactLensPrice: { type: String }, // Added contactLensPrice
  advance: { type: String },
  balance: { type: String },
  total: { type: String, required: true },
  paymentStatus: {
    type: String,
    enum: ["pending", "completed","paid"],
    required: true,
    default: "pending"
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

  // 👇 Add branch reference
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },

  // 👇 Add salesman reference
  salesmanId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }

}, { timestamps: true });

const FormDataModel = mongoose.model("FormData", FormDataSchema);
module.exports = FormDataModel;