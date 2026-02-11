const mongoose = require('mongoose');

const signalSchema = new mongoose.Schema({
  symbol: String,
  timestamp: { type: Date, default: Date.now },
  signal: String, // BUY, SELL, HOLD
  price: Number,
  stopLoss: Number,
  target: Number,
  riskRewardRatio: String,
  rsi: Number,
  ema: Number,
  reason: String,
  confidence: String
});

module.exports = mongoose.model('Signal', signalSchema);
