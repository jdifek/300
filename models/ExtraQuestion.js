const mongoose = require('mongoose');

const extraQuestionSchema = new mongoose.Schema({
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
  category: { type: String, required: true }
});

module.exports = mongoose.model('ExtraQuestion', extraQuestionSchema);