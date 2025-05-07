const mongoose = require('mongoose');

const tempQuestionSchema = new mongoose.Schema({
  text: String,
  options: Array,
  category: String,
  hint: String,
  imageUrl: String
});

module.exports = mongoose.model('TempQuestion', tempQuestionSchema);