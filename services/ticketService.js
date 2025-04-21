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
      console.log('📩 Запрос на отправку билета:', { number, userId, answers });
  
      const ticket = await Ticket.findOne({ number }).populate('questions');
      if (!ticket) {
        console.warn(`⚠️ Билет с номером ${number} не найден`);
        throw ApiError.NotFound('Билет не найден');
      }
      console.log('✅ Найден билет:', ticket.number);
  
      const user = await User.findById(userId);
      if (!user) {
        console.warn(`⚠️ Пользователь с ID ${userId} не найден`);
        throw ApiError.NotFound('Пользователь не найден');
      }
      console.log('✅ Пользователь найден:', user.email || user._id);
  
      // Подсчитываем результаты текущего запроса
      let correctAnswersDelta = 0;
      let mistakesDelta = 0;
      const detailedResults = [];
  
      // Проверяем, какие вопросы уже отвечены
      let ticketProgress = user.ticketsProgress.find(tp => tp.ticketNumber === number);
      if (!ticketProgress) {
        ticketProgress = {
          ticketNumber: number,
          isCompleted: false,
          mistakes: 0,
          correctAnswers: 0,
          totalQuestions: ticket.questions.length,
          answeredQuestions: [], // Добавляем массив для хранения отвеченных вопросов
          completedAt: null
        };
        user.ticketsProgress.push(ticketProgress);
        console.log('➕ Добавлен новый прогресс по билету:', ticketProgress);
      }
  
      // Обрабатываем текущие ответы
      answers.forEach(answer => {
        // Проверяем, не был ли вопрос уже отвечен
        const alreadyAnswered = ticketProgress.answeredQuestions.find(
          q => q.questionId === answer.questionId
        ); // Это строка 225
        if (alreadyAnswered) {
          console.log(`⚠️ Вопрос ${answer.questionId} уже был отвечен ранее`);
          return;
        }
  
        const question = ticket.questions.find(q => q._id.toString() === answer.questionId);
        if (!question) {
          console.warn(`❌ Вопрос не найден по ID: ${answer.questionId}`);
          detailedResults.push({
            questionId: answer.questionId,
            selectedOption: answer.selectedOption,
            isCorrect: false
          });
          mistakesDelta++;
          ticketProgress.answeredQuestions.push({
            questionId: answer.questionId,
            selectedOption: answer.selectedOption,
            isCorrect: false
          });
          return;
        }
  
        const correctOption = question.options.find(opt => opt.isCorrect);
        const isCorrect = correctOption && answer.selectedOption === correctOption.text;
  
        if (isCorrect) {
          correctAnswersDelta++;
        } else {
          mistakesDelta++;
        }
  
        detailedResults.push({
          questionId: answer.questionId,
          selectedOption: answer.selectedOption,
          isCorrect
        });
  
        ticketProgress.answeredQuestions.push({
          questionId: answer.questionId,
          selectedOption: answer.selectedOption,
          isCorrect
        });
  
        console.log(`📘 Вопрос ${question._id}: ответ "${answer.selectedOption}", правильный: "${correctOption?.text}", результат: ${isCorrect}`);
      });
  
      // Обновляем прогресс
      ticketProgress.correctAnswers += correctAnswersDelta;
      ticketProgress.mistakes += mistakesDelta;
  
      // Проверяем, все ли вопросы отвечены
      const totalAnswered = ticketProgress.answeredQuestions.length;
      if (totalAnswered >= ticket.questions.length) {
        ticketProgress.isCompleted = true;
        ticketProgress.completedAt = new Date();
      }
  
      console.log('📊 Подсчёт завершён:', {
        correctAnswers: ticketProgress.correctAnswers,
        mistakes: ticketProgress.mistakes,
        totalAnswered
      });
  
      // Обновляем общую статистику
      user.stats.ticketsCompleted = user.ticketsProgress.filter(tp => tp.isCompleted).length;
      user.stats.mistakes = user.ticketsProgress.reduce((acc, tp) => acc + tp.mistakes, 0);
  
      await user.save();
      console.log('✅ Пользователь обновлён:', {
        ticketsCompleted: user.stats.ticketsCompleted,
        totalMistakes: user.stats.mistakes
      });
  
      const successRate = (ticketProgress.correctAnswers / ticket.questions.length) * 100;
  
      const result = {
        ticketNumber: number,
        totalQuestions: ticket.questions.length,
        correctAnswers: ticketProgress.correctAnswers,
        mistakes: ticketProgress.mistakes,
        successRate,
        answers: detailedResults,
        totalAnswered
      };
  
      console.log('🏁 Финальный результат отправки билета:', result);
      return result;
    } catch (error) {
      console.error('💥 Ошибка при отправке билета:', error.message);
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