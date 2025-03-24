const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({ accessToken, refreshToken, userId: user._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Email from request:", email);

    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found!");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log("User found:", user);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log("Invalid password!");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log("Password is correct!");

    const { accessToken, refreshToken } = generateTokens(user._id);

    console.log("Generated tokens:", { accessToken, refreshToken });

    user.refreshToken = refreshToken;
    await user.save();

    console.log("Refresh token saved!");

    res.json({ accessToken, refreshToken, userId: user._id });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.telegramLogin = async (req, res) => {
  try {
    const { telegramId, username, avatar } = req.body;

    // Проверяем, что все обязательные поля переданы
    if (!telegramId || !username) {
      return res.status(400).json({ message: 'telegramId and username are required' });
    }

    // Ищем пользователя по telegramId
    let user = await User.findOne({ telegramId });

    if (!user) {
      // Если пользователь не найден, создаем нового
      user = new User({
        telegramId,
        username,
        avatar: avatar || 'default-avatar.png', // Если аватар не передан, используем дефолтный
        email: null, // Email не требуется для Telegram-авторизации
        password: null // Пароль не требуется для Telegram-авторизации
      });
    } else {
      // Если пользователь найден, обновляем данные
      user.username = username;
      if (avatar) user.avatar = avatar; // Обновляем аватар, только если он передан
    }

    // Генерируем токены
    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    res.json({ accessToken, refreshToken, userId: user._id });
  } catch (error) {
    console.error('Telegram login error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    console.log('Incoming request to refresh token:', req.body);

    const { refreshToken } = req.body;
    if (!refreshToken) {
      console.log('No refresh token provided');
      return res.status(401).json({ message: 'Refresh token required' });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      console.log('Decoded token:', decoded);
    } catch (err) {
      console.log('Token verification failed:', err.message);
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      console.log('User not found:', decoded.id);
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    if (user.refreshToken !== refreshToken) {
      console.log('Stored refresh token does not match');
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
    
    user.refreshToken = newRefreshToken;
    await user.save();

    console.log('New tokens generated for user:', user._id);
    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    console.log('Unexpected error:', error);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -refreshToken');
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
    ).select('-password -refreshToken');
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