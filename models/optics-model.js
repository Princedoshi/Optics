const mongoose = require("mongoose");

const FormDataSchema = new mongoose.Schema({
    billNo: { type: Number, unique: true }, 
    name: { type: String, required: true },
    contact: { type: String, required: true },
    date: { type: String, required: true },
    frame: { type: String }, // Not required
    glass: { type: String }, // Not required
    contactLens: { type: String }, // Not required
    advance: { type: String }, // Not required
    balance: { type: String }, // Not required
    total: { type: String, required: true },
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
});

const FormDataModel = mongoose.model("FormData", FormDataSchema);
module.exports = FormDataModel;
