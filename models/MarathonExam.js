const mongoose = require('mongoose');

const marathonExamSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  questions: [
    {
      questionId: {
        _id: { type: String, required: true },
        text: { type: String, required: true },
        options: [
          {
            text: { type: String, required: true }
          }
        ],
        hint: { type: String, default: null },
        imageUrl: { type: String, default: null },
        category: { type: String },
        questionNumber: { type: Number }
      },
      userAnswer: { type: Number, default: null },
      isCorrect: { type: Boolean, default: null }
    }
  ],
  mistakes: { type: Number, default: 0 },
  status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' },
  startTime: { type: Date, default: Date.now },
  completedQuestions: { type: Number, default: 0 },
  completedAt: { type: Date, default: null }, // Новое поле для времени завершения
  timeLimit: { type: Number, default: 20 * 60 * 1000 }, // 20 минут
  answeredQuestions: [ // Новое поле для хранения отвеченных вопросов
    {
      questionId: { type: String, required: true },
      selectedOption: { type: String, required: true },
      isCorrect: { type: Boolean, required: true },
      hint: { type: String, default: null },
      imageUrl: { type: String, default: null }
    }
  ],
  mistakesDetails: [ // Обновлено с добавлением hint и imageUrl
    {
      questionId: { type: String, required: true },
      questionText: { type: String, required: true },
      selectedOption: { type: String, required: true },
      correctOption: { type: String, required: true },
      hint: { type: String, default: null },
      imageUrl: { type: String, default: null }
    }
  ]
});

module.exports = mongoose.model('MarathonExam', marathonExamSchema);