const Ticket = require('../models/Ticket');
const ApiError = require('../exceptions/api-error');

class TicketService {
  async getAllTickets() {
    try {
      const tickets = await Ticket.find().select('number questions');
      return tickets;
    } catch (error) {
      throw new Error(`Ошибка при получении билетов: ${error.message}`);
    }
  }

  async getTicketByNumber(number) {
    try {
      const ticket = await Ticket.findOne({ number })
        .populate('questions');

      if (!ticket) {
        throw ApiError.NotFound('Билет не найден');
      }

      return ticket;
    } catch (error) {
      throw new Error(`Ошибка при получении билета: ${error.message}`);
    }
  }

  async getQuestionsByCategory(category) {
    try {
      const tickets = await Ticket.find()
        .populate({
          path: 'questions',
          match: { category }
        });

      const questions = tickets.reduce((acc, ticket) => {
        return acc.concat(ticket.questions.filter(q => q.category === category));
      }, []);

      return questions;
    } catch (error) {
      throw new Error(`Ошибка при получении вопросов по категории: ${error.message}`);
    }
  }

  async getRandomQuestions(count) {
    try {
      const tickets = await Ticket.find().populate('questions');
      const allQuestions = tickets.reduce((acc, ticket) => {
        return acc.concat(ticket.questions);
      }, []);

      // Перемешиваем вопросы
      const shuffled = allQuestions.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    } catch (error) {
      throw new Error(`Ошибка при получении случайных вопросов: ${error.message}`);
    }
  }
}

module.exports = new TicketService(); 