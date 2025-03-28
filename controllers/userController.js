const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

exports.telegramLogin = async (req, res) => {
  try {
    const { telegramId, username, avatar } = req.body;

    if (!telegramId || !username) {
      return res.status(400).json({ message: 'telegramId and username are required' });
    }

    let user = await User.findOne({ telegramId });

    if (!user) {
      user = new User({
        telegramId,
        username,
        avatar: avatar || 'default-avatar.png'
      });
    } else {
      user.username = username;
      if (avatar) user.avatar = avatar;
    }

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    res.json({ accessToken, refreshToken, userId: user._id });
  } catch (error) {
    console.error('Telegram login error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};
// controllers/userController.js (фрагмент)
exports.telegramLogin = async (req, res) => {
  try {
    const { telegramId, username, avatar } = req.body;
    if (!telegramId || !username) {
      return res.status(400).json({ message: 'telegramId and username are required' });
    }

    let user = await User.findOne({ telegramId });
    if (!user) {
      user = new User({
        telegramId,
        username,
        avatar: avatar || 'default-avatar.png',
        firstLogin: Date.now() // Устанавливаем при первом входе
      });
    } else {
      user.username = username;
      if (avatar) user.avatar = avatar;
    }

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    res.json({ accessToken, refreshToken, userId: user._id });
  } catch (error) {
    console.error('Telegram login error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Остальные методы остаются без изменений

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
    res.json(user);
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
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.updateSubscription = async (req, res) => {
  try {
    const { type, autoRenew } = req.body;
    const expiresAt = type === 'premium' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { subscription: { type, expiresAt, autoRenew } },
      { new: true }
    ).select('-password -refreshToken');
    if (!user) return res.status(404).json({ message: 'User not found' });
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
    res.json({ progress });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};