// services/NotificationService.js
const Notification = require('../models/Notification');

class NotificationService {
  async getNotification(userId) {
    // Возвращаем уведомления, которые пользователь еще не пометил как прочитанные
    return await Notification.find({ readBy: { $ne: userId } }).lean();
  }

  async createNotification(data) {
    const { title, description, videoUrl } = data;
    return await Notification.create({ title, description, videoUrl });
  }

  async markAsRead(notificationId, userId) {
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { $addToSet: { readBy: userId } }, // Добавляем userId в readBy, если его там нет
      { new: true }
    );
    if (!notification) {
      throw new Error('Уведомление не найдено');
    }
    return { message: 'Уведомление отмечено как прочитанное' };
  }
}

module.exports = new NotificationService();