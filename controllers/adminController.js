// controllers/adminController.js
const BroadcastMessage = require('../models/BroadcastMessage');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const LinkClick = require('../models/LinkClick');
const User = require('../models/User');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

exports.getLinkAnalytics = async (req, res) => {
  try {
    const { link, startDate, endDate } = req.query;
    const query = {};

    if (link) query.link = link;
    if (startDate || endDate) {
      query.clickedAt = {};
      if (startDate) query.clickedAt.$gte = new Date(startDate);
      if (endDate) query.clickedAt.$lte = new Date(endDate);
    }

    const clicks = await LinkClick.find(query);
    const totalClicks = clicks.length;
    const clicksByLink = await LinkClick.aggregate([
      { $match: query },
      { $group: { _id: '$link', count: { $sum: 1 } } },
      { $project: { link: '$_id', count: 1, _id: 0 } },
    ]);

    res.json({ totalClicks, clicksByLink });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

exports.getUserAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const totalUsers = await User.countDocuments(query);
    const activeUsers = await User.countDocuments({
      ...query,
      'stats.totalTimeSpent': { $gt: 0 },
    });
    const blockedUsers = await User.countDocuments({
      ...query,
      isBlocked: true, // Предполагается поле isBlocked
    });

    const dailyActiveUsers = await User.countDocuments({
      ...query,
      lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });
    const triDailyActiveUsers = await User.countDocuments({
      ...query,
      lastLogin: { $gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
    });

    const totalSubscriptions = await User.countDocuments({
      ...query,
      'subscription.type': 'premium',
    });
    const activeSubscriptions = await User.countDocuments({
      ...query,
      'subscription.type': 'premium',
      'subscription.expiresAt': { $gte: new Date() },
    });

    const multiRenewalUsers = await User.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'subscriptionhistories', // Предполагается коллекция для истории подписок
          localField: '_id',
          foreignField: 'userId',
          as: 'subscriptions',
        },
      },
      { $match: { 'subscriptions.1': { $exists: true } } },
      { $count: 'multiRenewalUsers' },
    ]);

    res.json({
      totalUsers,
      activeUsers,
      blockedUsers,
      dailyActiveUsers,
      triDailyActiveUsers,
      totalSubscriptions,
      activeSubscriptions,
      multiRenewalUsers: multiRenewalUsers[0]?.multiRenewalUsers || 0,
    });
  } catch (error) {
    console.error('Ошибка аналитики:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

exports.giftSubscription = async (req, res) => {
  try {
    const { userId, planName } = req.body;
    if (!userId || !planName) {
      return res.status(400).json({ message: 'userId и planName обязательны' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const plan = await SubscriptionPlan.findOne({ name: planName });
    if (!plan) {
      return res.status(404).json({ message: 'Тариф не найден' });
    }

    const expiresAt = new Date(Date.now() + plan.duration * 24 * 60 * 60 * 1000);
    user.subscription = {
      type: 'premium',
      expiresAt,
      autoRenew: false,
    };
    await user.save();

    // Запись в историю подписок
    await new SubscriptionHistory({
      userId: user._id,
      planName,
      startDate: new Date(),
      endDate: expiresAt,
    }).save();

    // Отправка уведомления через Telegram
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramApi = `https://api.telegram.org/bot${botToken}`;
    await axios.post(`${telegramApi}/sendMessage`, {
      chat_id: user.telegramId,
      text: `Поздравляем! Вам подарена подписка "${planName}" на ${plan.duration} дней!`,
    });

    res.json({ message: 'Подписка подарена', user });
  } catch (error) {
    console.error('Ошибка подарка подписки:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};
exports.updateSubscriptionPlan = async (req, res) => {
  try {
    const { name, price, duration, description } = req.body;
    if (!name || !price || !duration) {
      return res.status(400).json({ message: 'Name, price, and duration are required' });
    }

    let plan = await SubscriptionPlan.findOne({ name });
    if (plan) {
      plan.price = price;
      plan.duration = duration;
      plan.description = description;
      plan.updatedAt = Date.now();
    } else {
      plan = new SubscriptionPlan({ name, price, duration, description });
    }

    await plan.save();
    res.json({ message: 'Тариф обновлён', plan });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

exports.getSubscriptionPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find();
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};

exports.sendBroadcast = async (req, res) => {
  try {
    const { text } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
    const adminId = req.user.id;

    if (!text) {
      return res.status(400).json({ message: 'Текст сообщения обязателен' });
    }

    // Создаём запись о рассылке
    const broadcast = new BroadcastMessage({
      text,
      imageUrl: imagePath,
      sentBy: adminId,
      recipients: [],
      status: 'draft',
    });

    // Получаем всех пользователей
    const users = await User.find({}).select('telegramId');
    broadcast.recipients = users.map((u) => u._id);

    // Отправка через Telegram Bot API
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramApi = `https://api.telegram.org/bot${botToken}`;

    for (const user of users) {
      try {
        if (imagePath) {
          // Отправка изображения с подписью
          await axios.post(`${telegramApi}/sendPhoto`, {
            chat_id: user.telegramId,
            photo: `${process.env.APP_URL}${imagePath}`,
            caption: text,
          });
        } else {
          // Отправка только текста
          await axios.post(`${telegramApi}/sendMessage`, {
            chat_id: user.telegramId,
            text,
          });
        }
      } catch (error) {
        console.error(`Ошибка отправки пользователю ${user.telegramId}:`, error.message);
      }
    }

    broadcast.status = 'sent';
    await broadcast.save();

    res.json({ message: 'Сообщение отправлено', broadcastId: broadcast._id });
  } catch (error) {
    console.error('Ошибка рассылки:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};