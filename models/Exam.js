const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  ticketNumber: { type: Number, required: true },
  questions: [
    {
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket.questions' },
      userAnswer: { type: Number, default: null },
      isCorrect: { type: Boolean, default: null }
    }
  ],
  extraQuestions: [
    {
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExtraQuestion' },
      userAnswer: { type: Number, default: null },
      isCorrect: { type: Boolean, default: null }
    }
  ],
  mistakes: { type: Number, default: 0 },
  status: { type: String, enum: ['in_progress', 'passed', 'failed'], default: 'in_progress' },
  startTime: { type: Date, default: Date.now },
  timeLimit: { type: Number, default: 20 * 60 * 1000 }, // 20 минут
  extraTime: { type: Number, default: 0 }, // Дополнительное время
  mistakesDetails: [ // Новое поле для хранения ошибок
    {
      questionId: { type: String, required: true },
      questionText: { type: String, required: true },
      selectedOption: { type: String, required: true },
      correctOption: { type: String, required: true }
    }
  ]
});

module.exports = mongoose.model('Exam', examSchema);