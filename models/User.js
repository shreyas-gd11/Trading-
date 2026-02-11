const mongoose = require('mongoose');

const strategySettingsSchema = new mongoose.Schema({
  ema20Period: { type: Number, default: 20 },
  ema50Period: { type: Number, default: 50 },
  rsiPeriod: { type: Number, default: 14 },
  vixThreshold: { type: Number, default: 15 },
  rsiThreshold: { type: Number, default: 70 }
}, { _id: false });

const alertSchema = new mongoose.Schema({
  symbol: { type: String, required: true },
  condition: { type: String, required: true },
  value: { type: Number, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required']
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  profilePicture: {
    type: String,
    default: ''
  },
  strategySettings: {
    type: strategySettingsSchema,
    default: {}
  },
  alerts: [alertSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);