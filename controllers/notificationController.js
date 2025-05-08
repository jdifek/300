// controllers/NotificationController.js
const notificationService = require("../services/NotificationService");

class NotificationController {
  async getNotification(req, res, next) {
    try {
      const notification = await notificationService.getNotification(req.user._id);
      res.json(notification);
    } catch (error) {
      next(error);
    }
  }

  async createNotification(req, res, next) {
    try {
      const notification = await notificationService.createNotification(req.body);
      res.status(201).json(notification);
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const result = await notificationService.markAsRead(id, req.user._id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();