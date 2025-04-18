const Notification = require('../models/Notification');

class notificationService {
  async getNotification() {
    return await Notification.find().lean();
  }

  async createNotification(data) {
    const { title, description } = data;
    return await Notification.create({ title, description });
  }
}

module.exports = new notificationService(); 
