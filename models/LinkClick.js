const mongoose = require('mongoose');

const LinkClickSchema = new mongoose.Schema({
  link: { type: String, required: true }, // Например, реферальная ссылка
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  clickedAt: { type: Date, default: Date.now },
  source: { type: String }, // Источник перехода (например, Telegram, email)
});

module.exports = mongoose.model('LinkClick', LinkClickSchema);