// models/User.js
const mongoose = require('mongoose');

const LessonProgressSchema = new mongoose.Schema({
  lessonId: { type: mongoose.Schema.Types.ObjectId, required: true },
  isCompleted: { type: Boolean, default: false },
  homeworkSubmitted: { type: Boolean, default: false },
  homeworkData: { type: String, default: null }
});

const CourseProgressSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  lastStudiedLesson: { type: mongoose.Schema.Types.ObjectId, default: null },
  lessons: [LessonProgressSchema]
});

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },
  telegramId: { type: String, required: true, unique: true, sparse: true },
  avatar: { type: String, default: 'default-avatar.png' },
  progress: { type: Number, default: 0 },
  stats: {
    ticketsCompleted: { type: Number, default: 0 },
    lessonsCompleted: { type: Number, default: 0 },
    totalTimeSpent: { type: Number, default: 0 },
    mistakes: { type: Number, default: 0 } // Добавлено поле для ошибок
  },
  subscription: {
    type: { type: String, enum: ['free', 'premium'], default: 'free' },
    expiresAt: { type: Date },
    autoRenew: { type: Boolean, default: false }
  },
  coursesProgress: [CourseProgressSchema],
  refreshToken: { type: String },
  firstLogin: { type: Date, default: Date.now },
  subscribedToChannel: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema); 