const mongoose = require('mongoose');

const SubscriptionPlanSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Например, "Premium"
  price: { type: Number, required: true }, // Стоимость в валюте
  duration: { type: Number, required: true }, // Длительность в днях
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('SubscriptionPlan', SubscriptionPlanSchema);