const mongoose = require('mongoose');

const RandomQuestionSessionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  questions: [
    {
      questionId: { type: String, required: true },
      ticketNumber: { type: Number, required: true },
      text: { type: String, required: true },
      options: [
        {
          text: { type: String, required: true },
          isCorrect: { type: Boolean, required: true }
        }
      ],
      category: { type: String, required: true },
      hint: { type: String },
      imageUrl: { type: String }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RandomQuestionSession', RandomQuestionSessionSchema);