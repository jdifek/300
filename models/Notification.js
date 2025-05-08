const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  videoUrl: { type: String }, // необязательное поле со ссылкой на видео
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Пользователи, пометившие как прочитанное
}, { timestamps: true }); // добавит createdAt и updatedAt автоматически

module.exports = mongoose.model('Notification', NotificationSchema);
