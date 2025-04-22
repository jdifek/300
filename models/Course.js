// models/Course.js
const mongoose = require('mongoose');

const LessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  videoUrl: [{ type: String }],
  additionalFiles: [{
    name: { type: String },
    url: { type: String }
  }],
  order: { type: Number, required: true },
  thumbnail: { type: String, default: '' }
});

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    required: true
  },
  lessons: [LessonSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Course', CourseSchema);