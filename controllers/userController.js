// controllers/userController.js
const User = require('../models/User');
const SubscriptionHistory = require('../models/SubscriptionHistory');
const jwt = require('jsonwebtoken');

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};
exports.telegramLogin = async (req, res) => {
  try {
    const { telegramId, username, avatar } = req.body;
    console.log('[LOGIN][REQ_BODY]', { telegramId, username, avatar });

    if (!telegramId || !username) {
      console.warn('[LOGIN][VALIDATION_FAIL]', 'Missing telegramId or username');
      return res.status(400).json({ message: 'telegramId and username are required' });
    }

    const normalizedTelegramId = String(telegramId);
    let user = await User.findOne({ telegramId: normalizedTelegramId });
    console.log('[LOGIN][USER_FOUND]', user ? `User ${user._id}` : 'No user found, will create new');

    if (!user) {
      user = new User({
        telegramId: normalizedTelegramId,
        username,
        avatar: avatar || 'default-avatar.png',
        firstLogin: Date.now()
      });
      console.log('[LOGIN][USER_CREATED]', user);
    } else {
      user.username = username;
      if (avatar) user.avatar = avatar;
      console.log('[LOGIN][USER_UPDATED]', { username, avatar });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;

    await user.save()
      .then(() => console.log('[LOGIN][USER_SAVED]', user._id))
      .catch(e => console.error('[LOGIN][SAVE_ERROR]', e));

    res.json({ accessToken, refreshToken, userId: user._id });
  } catch (error) {
    console.error('[LOGIN][ERROR]', error.message, error.stack);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: 'Refresh token required' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-refreshToken');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const progress = Math.min(((user.stats.ticketsCompleted * 2 + user.stats.lessonsCompleted) / 100) * 100, 100);
    await User.findByIdAndUpdate(req.user.id, { progress });

    res.json({
      username: user.username,
      telegramId: user.telegramId,
      avatar: user.avatar,
      subscription: user.subscription,
      progress: {
        percentage: progress,
        ticketsCompleted: user.stats.ticketsCompleted,
        lessonsCompleted: user.stats.lessonsCompleted,
        totalTimeSpent: user.stats.totalTimeSpent,
        mistakes: user.stats.mistakes // Добавлено поле ошибок
      },
      firstLogin: user.firstLogin,
      subscribedToChannel: user.subscribedToChannel,
      createdAt: user.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { username, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { username, avatar },
      { new: true }
    ).select('-refreshToken');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const progress = Math.min(((user.stats.ticketsCompleted * 2 + user.stats.lessonsCompleted) / 100) * 100, 100);
    await User.findByIdAndUpdate(req.user.id, { progress });

    res.json({
      username: user.username,
      telegramId: user.telegramId,
      avatar: user.avatar,
      subscription: user.subscription,
      progress: {
        percentage: progress,
        ticketsCompleted: user.stats.ticketsCompleted,
        lessonsCompleted: user.stats.lessonsCompleted,
        totalTimeSpent: user.stats.totalTimeSpent,
        mistakes: user.stats.mistakes // Добавлено поле ошибок
      },
      firstLogin: user.firstLogin,
      subscribedToChannel: user.subscribedToChannel,
      createdAt: user.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateSubscription = async (req, res) => {
  try {
    const { type, autoRenew, planName } = req.body;
    const expiresAt = type === 'premium' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { subscription: { type, expiresAt, autoRenew } },
      { new: true }
    ).select('-refreshToken');
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (type === 'premium' && planName) {
      const plan = await SubscriptionPlan.findOne({ name: planName });
      if (plan) {
        await new SubscriptionHistory({
          userId: user._id,
          planName,
          startDate: new Date(),
          endDate: expiresAt,
        }).save();
      }
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProgress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const progress = Math.min(((user.stats.ticketsCompleted * 2 + user.stats.lessonsCompleted) / 100) * 100, 100);
    await User.findByIdAndUpdate(req.user.id, { progress });

    res.json({
      percentage: progress,
      ticketsCompleted: user.stats.ticketsCompleted,
      lessonsCompleted: user.stats.lessonsCompleted,
      totalTimeSpent: user.stats.totalTimeSpent,
      mistakes: user.stats.mistakes // Добавлено поле ошибок
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};