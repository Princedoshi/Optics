// models/user.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },

  passwordHash: {
    type: String,
    required: true,
  },

  role: {
    type: String,
    enum: ['owner', 'manager', 'salesman', 'admin','demo'],
    required: true,
  },

  branchIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }],


}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
