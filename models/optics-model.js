const mongoose = require("mongoose");

const FormDataSchema = new mongoose.Schema({
    name: { type: String, required: true },
    contact: { type: String, required: true },
    date: { type: String, required: true },
    frame: { type: String, required: true },
    glass: { type: String, required: true },
    contactLens: { type: String, required: true },
    advance: { type: String, required: true },
    balance: { type: String, required: true },
    total: { type: String, required: true },
    prescription: {
        dist: {
            rightSph: { type: String, required: true },
            rightCyl: { type: String, required: true },
            rightAxis: { type: String, required: true },
            leftSph: { type: String, required: true },
            leftCyl: { type: String, required: true },
            leftAxis: { type: String, required: true },
        },
        near: {
            rightSph: { type: String, required: true },
            rightCyl: { type: String, required: true },
            rightAxis: { type: String, required: true },
            leftSph: { type: String, required: true },
            leftCyl: { type: String, required: true },
            leftAxis: { type: String, required: true },
        },
        notes: { type: String, required: true },
    },
});

const FormDataModel = mongoose.model("FormData", FormDataSchema);

module.exports = FormDataModel;
