const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true
  },
  telegramId: {
    type: String,
    required: true, // Now required since it's the only auth method
    unique: true,
    sparse: true
  },
  avatar: {
    type: String,
    default: 'default-avatar.png'
  },
  progress: {
    type: Number,
    default: 0
  },
  stats: {
    ticketsCompleted: { type: Number, default: 0 },
    lessonsCompleted: { type: Number, default: 0 },
    totalTimeSpent: { type: Number, default: 0 }
  },
  subscription: {
    type: {
      type: String,
      enum: ['free', 'premium'],
      default: 'free'
    },
    expiresAt: {
      type: Date
    },
    autoRenew: {
      type: Boolean,
      default: false
    }
  },
  refreshToken: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);