require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const Ticket = require('../models/Ticket');
const ExtraQuestion = require('../models/ExtraQuestion');

// Проверка наличия URI
if (!process.env.MONGODB_URI) {
  console.error('Ошибка: MONGODB_URI не установлена в .env файле');
  process.exit(1);
}

// Подключение к MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

async function importData() {
  try {
    // Чтение JSON файлов
    const ticketsData = JSON.parse(fs.readFileSync('./tickets.json', 'utf8'));
    const extraQuestionsData = JSON.parse(fs.readFileSync('./extra_questions.json', 'utf8'));

    // Очистка существующих коллекций
    await Ticket.deleteMany({});
    await ExtraQuestion.deleteMany({});

    // Импорт билетов
    for (const ticketData of ticketsData) {
      const ticket = new Ticket(ticketData);
      await ticket.save();
      console.log(`Импортирован билет №${ticket.number}`);
    }

    // Импорт дополнительных вопросов
    for (const questionData of extraQuestionsData) {
      const question = new ExtraQuestion(questionData);
      await question.save();
      console.log(`Импортирован дополнительный вопрос: ${question.text.substring(0, 50)}...`);
    }

    console.log('Импорт данных завершен успешно');
    process.exit(0);
  } catch (error) {
    console.error('Ошибка при импорте данных:', error);
    process.exit(1);
  }
}

importData(); 