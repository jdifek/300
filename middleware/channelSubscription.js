// middleware/channelSubscription.js
const User = require('../models/User');

exports.checkChannelSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
    const timeSinceFirstLogin = Date.now() - new Date(user.firstLogin).getTime();

    if (timeSinceFirstLogin > twoDaysInMs && !user.subscribedToChannel) {
      return res.status(403).json({ 
        message: 'Please subscribe to the channel to continue using the app' 
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};