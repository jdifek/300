const Notification = require('../models/Notification');

class notificationService {
  async getNotification() {
    return await Notification.find().lean();
  }

  async createNotification(data) {
    const { title, description, videoUrl } = data;
    return await Notification.create({ title, description, videoUrl });
  }
  
}

module.exports = new notificationService(); 
