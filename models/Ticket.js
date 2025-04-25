const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  number: { type: Number, required: true, unique: true },
  questions: [
    {
      text: { type: String, required: true },
      imageUrl: { type: String },
      options: [
        {
          text: { type: String, required: true },
          isCorrect: { type: Boolean, required: true }
        }
      ],
      hint: { type: String },
      videoUrl: { type: String },
      category: { type: String, required: true },
      questionNumber: { type: Number, required: true }
    }
  ],
  videoUrl: { type: String }
});

module.exports = mongoose.model('Ticket', ticketSchema);