// models/branch.js
const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },

  location: {
    type: String,
    required: true,
    trim: true,
  },

  phoneNumber: {
    type: String,
    required: true,
    trim: true,
  },

  parent_name: {
    type: String,
    required: true,
    trim: true,
  },

  googlePlaceId: {
    type: String,
    required: true,
    trim: true,
  },

}, { timestamps: true });

const Branch = mongoose.model('Branch', branchSchema);

module.exports = Branch;
