const mongoose = require('mongoose');

const LessonProgressSchema = new mongoose.Schema({
  lessonId: { type: mongoose.Schema.Types.ObjectId, required: true },
  isCompleted: { type: Boolean, default: false },
  homeworkSubmitted: { type: Boolean, default: false },
  homeworkData: { type: String, default: null },
  isWatched: { type: Boolean, default: false } 
});

const CourseProgressSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  lastStudiedLesson: { type: mongoose.Schema.Types.ObjectId, default: null },
  lessons: [LessonProgressSchema]
});

const TicketProgressSchema = new mongoose.Schema({
  ticketNumber: { type: Number, required: true },
  isCompleted: { type: Boolean, default: false },
  mistakes: { type: Number, default: 0 },
  correctAnswers: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 0 },
  startedAt: { type: Date }, // Добавляем поле для времени начала
  completedAt: { type: Date },
  answeredQuestions: [
    {
      questionId: { type: String, required: true },
      selectedOption: { type: String, required: true },
      isCorrect: { type: Boolean, required: true },
      hint: { type: String },// new
      imageUrl: { type: String } // new
    }
  ],
  mistakesDetails: [
    {
      questionId: { type: String, required: true },
      questionText: { type: String, required: true },
      selectedOption: { type: String, required: true },
      correctOption: { type: String, required: true },
      hint: { type: String }, // new
      imageUrl: { type: String } // new
    }
  ]
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
    mistakes: { type: Number, default: 0 }
  },
  subscription: {
    type: { type: String, enum: ['free', 'premium'], default: 'free' },
    expiresAt: { type: Date },
    autoRenew: { type: Boolean, default: false }
  },
  coursesProgress: [CourseProgressSchema],
  ticketsProgress: [TicketProgressSchema],
  refreshToken: { type: String },
  firstLogin: { type: Date, default: Date.now },
  subscribedToChannel: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);