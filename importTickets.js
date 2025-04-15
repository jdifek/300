const mongoose = require('mongoose');
const Ticket = require('./models/Ticket.js');
require('dotenv').config();

async function importTickets(jsonData) {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('Connected to MongoDB');
    }

    console.log(`Total tickets in JSON: ${jsonData.length}`);
    jsonData.forEach((ticket) => {
      console.log(`Ticket number: ${ticket.number}, questions: ${ticket.questions.length}`);
    });

    const transformedData = [];
    for (const ticket of jsonData) {
      try {
        const transformedTicket = {
          number: ticket.number,
          questions: ticket.questions.map((question, qIndex) => {
            // Проверка корректности correctAnswer
            if (question.correctAnswer < 0 || question.correctAnswer >= question.options.length) {
              throw new Error(
                `Invalid correctAnswer (${question.correctAnswer}) for question ${qIndex + 1} in ticket ${ticket.number}`
              );
            }
            return {
              text: question.text,
              imageUrl: question.imageUrl || '',
              options: question.options.map((option, optIndex) => ({
                text: option,
                isCorrect: optIndex === question.correctAnswer,
              })),
              hint: question.hint || '',
              videoUrl: question.videoUrl || '',
              category: question.category || '',
              questionNumber: question.questionNumber,
            };
          }),
        };
        transformedData.push(transformedTicket);
        console.log(`Transformed ticket number: ${ticket.number}`);
      } catch (err) {
        console.error(`Error transforming ticket number ${ticket.number}:`, err.message);
      }
    }

    console.log(`Total tickets to insert: ${transformedData.length}`);

    await Ticket.deleteMany({});
    console.log('Cleared existing tickets in DB');

    let insertedCount = 0;
    for (const ticket of transformedData) {
      try {
        await Ticket.create(ticket);
        console.log(`Inserted ticket number: ${ticket.number}`);
        insertedCount++;
      } catch (err) {
        console.error(`Error inserting ticket number ${ticket.number}:`, err.message);
      }
    }

    console.log(`Total tickets inserted: ${insertedCount}`);

    const ticketsInDb = await Ticket.find({}).sort({ number: 1 });
    console.log(`Total tickets in DB: ${ticketsInDb.length}`);
    ticketsInDb.forEach((ticket) => {
      console.log(`DB Ticket: number=${ticket.number}, questions=${ticket.questions.length}`);
    });

  } catch (error) {
    console.error('Error importing tickets:', error);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
  }
}

module.exports = importTickets;

const ticketsData = require('./tickets.json');
importTickets(ticketsData);