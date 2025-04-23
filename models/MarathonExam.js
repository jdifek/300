const mongoose = require('mongoose');

const marathonExamSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  questions: [
    {
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket.questions' },
      userAnswer: { type: Number, default: null },
      isCorrect: { type: Boolean, default: null }
    }
  ],
  mistakes: { type: Number, default: 0 },
  status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' },
  startTime: { type: Date, default: Date.now },
  completedQuestions: { type: Number, default: 0 }, // Количество отвеченных вопросов
  mistakesDetails: [ // Новое поле для хранения ошибок
    {
      questionId: { type: String, required: true },
      questionText: { type: String, required: true },
      selectedOption: { type: String, required: true },
      correctOption: { type: String, required: true }
    }
  ]
});

module.exports = mongoose.model('MarathonExam', marathonExamSchema);