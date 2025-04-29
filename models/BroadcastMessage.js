const mongoose = require('mongoose');

const BroadcastMessageSchema = new mongoose.Schema({
  text: { type: String, required: true },
  imageUrl: { type: String }, // URL загруженной картинки
  sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Админ, отправивший сообщение
  sentAt: { type: Date, default: Date.now },
  recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Получатели
  status: { type: String, enum: ['draft', 'sent', 'failed'], default: 'draft' },
});

module.exports = mongoose.model('BroadcastMessage', BroadcastMessageSchema);