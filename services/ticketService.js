const Ticket = require('../models/Ticket');
const User = require('../models/User');
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

  async getTicketByNumber(ticketNumber) {
    try {
      // Проверяем, что ticketNumber является числом
      if (isNaN(ticketNumber)) {
        throw new Error('Неверный номер билета');
      }

      const ticket = await Ticket.findOne({ number: ticketNumber }).populate('questions');
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
      const tickets = await Ticket.find().populate({
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
      const shuffled = allQuestions.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    } catch (error) {
      throw new Error(`Ошибка при получении случайных вопросов: ${error.message}`);
    }
  }

  async startTicket(number, userId) {
    try {
      const ticket = await Ticket.findOne({ number }).populate('questions');
      if (!ticket) {
        throw ApiError.NotFound('Билет не найден');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw ApiError.NotFound('Пользователь не найден');
      }

      // Проверяем, начинал ли пользователь этот билет
      const ticketProgress = user.ticketsProgress.find(tp => tp.ticketNumber === number);
      if (!ticketProgress) {
        user.ticketsProgress.push({
          ticketNumber: number,
          isCompleted: false,
          mistakes: 0,
          correctAnswers: 0,
          totalQuestions: ticket.questions.length
        });
        await user.save();
      }

      return ticket;
    } catch (error) {
      throw new Error(`Ошибка при начале билета: ${error.message}`);
    }
  }

  async submitTicket(number, userId, answers) {
    try {
      const ticket = await Ticket.findOne({ number }).populate('questions');
      if (!ticket) {
        throw ApiError.NotFound('Билет не найден');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw ApiError.NotFound('Пользователь не найден');
      }

      // Подсчитываем результаты
      let correctAnswers = 0;
      let mistakes = 0;
      const detailedResults = [];

      answers.forEach(answer => {
        const question = ticket.questions.find(q => q._id.toString() === answer.questionId);
        if (!question) {
          detailedResults.push({
            questionId: answer.questionId,
            selectedOption: answer.selectedOption,
            isCorrect: false
          });
          mistakes++;
          return;
        }

        const correctOption = question.options.find(opt => opt.isCorrect);
        const isCorrect = correctOption && answer.selectedOption === correctOption.text;
        if (isCorrect) {
          correctAnswers++;
        } else {
          mistakes++;
        }

        detailedResults.push({
          questionId: answer.questionId,
          selectedOption: answer.selectedOption,
          isCorrect
        });
      });

      // Обновляем прогресс пользователя
      let ticketProgress = user.ticketsProgress.find(tp => tp.ticketNumber === number);
      if (!ticketProgress) {
        ticketProgress = {
          ticketNumber: number,
          isCompleted: true,
          mistakes,
          correctAnswers,
          totalQuestions: ticket.questions.length,
          completedAt: new Date()
        };
        user.ticketsProgress.push(ticketProgress);
      } else {
        ticketProgress.isCompleted = true;
        ticketProgress.mistakes = mistakes;
        ticketProgress.correctAnswers = correctAnswers;
        ticketProgress.totalQuestions = ticket.questions.length;
        ticketProgress.completedAt = new Date();
      }

      // Обновляем общую статистику
      user.stats.ticketsCompleted = user.ticketsProgress.filter(tp => tp.isCompleted).length;
      user.stats.mistakes = user.ticketsProgress.reduce((acc, tp) => acc + tp.mistakes, 0);
      await user.save();

      const successRate = (correctAnswers / ticket.questions.length) * 100;

      return {
        ticketNumber: number,
        totalQuestions: ticket.questions.length,
        correctAnswers,
        mistakes,
        successRate,
        answers: detailedResults
      };
    } catch (error) {
      throw new Error(`Ошибка при отправке билета: ${error.message}`);
    }
  }

  async getTicketProgress(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw ApiError.NotFound('Пользователь не найден');
      }

      const allTickets = await Ticket.find().select('number');
      const totalTickets = allTickets.length;
      const ticketsCompleted = user.ticketsProgress.filter(tp => tp.isCompleted).length;
      const totalMistakes = user.stats.mistakes;

      // Определяем следующий билет
      let nextTicket = 1;
      for (let i = 1; i <= totalTickets; i++) {
        const ticketProgress = user.ticketsProgress.find(tp => tp.ticketNumber === i);
        if (!ticketProgress || !ticketProgress.isCompleted) {
          nextTicket = i;
          break;
        }
      }

      return {
        totalTickets,
        ticketsCompleted,
        totalMistakes,
        ticketsProgress: user.ticketsProgress,
        nextTicket
      };
    } catch (error) {
      throw new Error(`Ошибка при получении прогресса: ${error.message}`);
    }
  }
}

module.exports = new TicketService();