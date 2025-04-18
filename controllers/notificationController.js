const notificationService = require("../services/notificationService");

class NotificationController {
  async getNotification(req, res, next) {
    try {
      const notification = await notificationService.getNotification();
      res.json(notification)
    } catch (error) {
      next(error);
    }
  }

  async createNotification(req, res, next) {
    try {
      const notification = await notificationService.createNotification(req.body);
      res.json(notification);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController(); 