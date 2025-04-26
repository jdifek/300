const Ticket = require('../models/Ticket');
const User = require('../models/User');
const ApiError = require('../exceptions/api-error');

class TicketService {
  async getAllTickets() {
    try {
      const tickets = await Ticket.find().select('number questions videoUrl');
      return tickets;
    } catch (error) {
      throw new Error(`Ошибка при получении билетов: ${error.message}`);
    }
  }

  async getTicketByNumber(ticketNumber) {
    try {
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
  async getCategoryProgress(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw ApiError.NotFound('Пользователь не найден');
      }
      const tickets = await Ticket.find();
      const allQuestions = tickets.flatMap(ticket => ticket.questions);
      const categories = [...new Set(allQuestions.map(q => q.category))];
      const categoryProgress = categories.map(category => {
        const questionsInCategory = allQuestions.filter(q => q.category === category);
        const totalQuestions = questionsInCategory.length;
        const userCategoryProgress = user.categoriesProgress.find(cp => cp.category === category) || {
          category,
          totalQuestions,
          correctAnswers: 0,
          mistakes: 0,
          answeredQuestions: [],
          mistakesDetails: [],
          startedAt: null
        };
        return {
          category,
          totalQuestions,
          correctAnswers: userCategoryProgress.correctAnswers,
          mistakes: userCategoryProgress.mistakes,
          answeredQuestions: userCategoryProgress.answeredQuestions,
          mistakesDetails: userCategoryProgress.mistakesDetails,
          startedAt: userCategoryProgress.startedAt
        };
      });
      return {
        totalCategories: categories.length,
        categoriesProgress: categoryProgress
      };
    } catch (error) {
      throw new Error(`Ошибка при получении прогресса по категориям: ${error.message}`);
    }
  }

  async startCategory(category, userId) {
    try {
      const tickets = await Ticket.find();
      const allQuestions = tickets.flatMap(ticket => ticket.questions);
      const categoryQuestions = allQuestions.filter(q => q.category === category);
      if (categoryQuestions.length === 0) {
        throw ApiError.NotFound('Категория не найдена или не содержит вопросов');
      }
      const user = await User.findById(userId);
      if (!user) {
        throw ApiError.NotFound('Пользователь не найден');
      }
      const categoryProgressIndex = user.categoriesProgress.findIndex(cp => cp.category === category);
      const newCategoryProgress = {
        category,
        totalQuestions: categoryQuestions.length,
        correctAnswers: 0,
        mistakes: 0,
        startedAt: new Date(),
        answeredQuestions: [],
        mistakesDetails: []
      };
      if (categoryProgressIndex !== -1) {
        const existingProgress = user.categoriesProgress[categoryProgressIndex];
        if (existingProgress.answeredQuestions.length >= existingProgress.totalQuestions) {
          user.categoriesProgress.splice(categoryProgressIndex, 1);
          user.categoriesProgress.push(newCategoryProgress);
          console.log(`🔄 Сброс прогресса для категории ${category}`);
        } else {
          if (!existingProgress.startedAt) {
            existingProgress.startedAt = new Date();
          }
        }
      } else {
        user.categoriesProgress.push(newCategoryProgress);
      }
      await user.save();
      return {
        category,
        totalQuestions: categoryQuestions.length,
        message: 'Category started successfully'
      };
    } catch (error) {
      throw new Error(`Ошибка при начале категории: ${error.message}`);
    }
  }

  async submitCategory(category, userId, answers) {
    try {
      const tickets = await Ticket.find();
      const allQuestions = tickets.flatMap(ticket => ticket.questions);
      const categoryQuestions = allQuestions.filter(q => q.category === category);
      if (categoryQuestions.length === 0) {
        throw ApiError.NotFound('Категория не найдена или не содержит вопросов');
      }
      const user = await User.findById(userId);
      if (!user) {
        throw ApiError.NotFound('Пользователь не найден');
      }
      let categoryProgress = user.categoriesProgress.find(cp => cp.category === category);
      if (!categoryProgress) {
        categoryProgress = {
          category,
          totalQuestions: categoryQuestions.length,
          correctAnswers: 0,
          mistakes: 0,
          startedAt: new Date(),
          answeredQuestions: [],
          mistakesDetails: []
        };
        user.categoriesProgress.push(categoryProgress);
      }
      let correctAnswersDelta = 0;
      let mistakesDelta = 0;
      const detailedResults = [];
      answers.forEach(answer => {
        const alreadyAnswered = categoryProgress.answeredQuestions.find(
          q => q.questionId === answer.questionId
        );
        if (alreadyAnswered) {
          console.log(`⚠️ Вопрос ${answer.questionId} уже был отвечен`);
          return;
        }
        const question = categoryQuestions.find(q => q._id.toString() === answer.questionId);
        if (!question) {
          detailedResults.push({
            questionId: answer.questionId,
            selectedOption: answer.selectedOption,
            isCorrect: false
          });
          mistakesDelta++;
          categoryProgress.answeredQuestions.push({
            questionId: answer.questionId,
            selectedOption: answer.selectedOption,
            isCorrect: false,
            hint: null,
            imageUrl: null,
            videoUrl: null
          });
          categoryProgress.mistakesDetails.push({
            questionId: answer.questionId,
            questionText: 'Вопрос не найден',
            selectedOption: answer.selectedOption,
            correctOption: 'Неизвестно',
            hint: null,
            imageUrl: null,
            videoUrl: null
          });
          return;
        }
        const correctOption = question.options.find(opt => opt.isCorrect);
        const isCorrect = correctOption && answer.selectedOption === correctOption.text;
        if (isCorrect) {
          correctAnswersDelta++;
        } else {
          mistakesDelta++;
          categoryProgress.mistakesDetails.push({
            questionId: answer.questionId,
            questionText: question.text,
            selectedOption: answer.selectedOption,
            correctOption: correctOption.text,
            hint: question.hint || null,
            imageUrl: question.imageUrl || null,
            videoUrl: question.videoUrl || null
          });
        }
        detailedResults.push({
          questionId: answer.questionId,
          selectedOption: answer.selectedOption,
          isCorrect
        });
        categoryProgress.answeredQuestions.push({
          questionId: answer.questionId,
          selectedOption: answer.selectedOption,
          isCorrect,
          hint: question.hint || null,
          imageUrl: question.imageUrl || null,
          videoUrl: question.videoUrl || null
        });
      });
      categoryProgress.correctAnswers += correctAnswersDelta;
      categoryProgress.mistakes += mistakesDelta;
      user.stats.mistakes = user.ticketsProgress.reduce((acc, tp) => acc + tp.mistakes, 0) +
                           user.categoriesProgress.reduce((acc, cp) => acc + cp.mistakes, 0);
      await user.save();
      const successRate = (categoryProgress.correctAnswers / categoryProgress.totalQuestions) * 100;
      return {
        category,
        totalQuestions: categoryProgress.totalQuestions,
        correctAnswers: categoryProgress.correctAnswers,
        mistakes: categoryProgress.mistakes,
        successRate,
        answers: detailedResults
      };
    } catch (error) {
      throw new Error(`Ошибка при отправке ответов по категории: ${error.message}`);
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

      // Находим существующий прогресс билета
      const ticketProgressIndex = user.ticketsProgress.findIndex(tp => tp.ticketNumber === number);

      // Создаем новый объект прогресса
      const newTicketProgress = {
        ticketNumber: number,
        startedAt: new Date(),
        isCompleted: false,
        mistakes: 0,
        correctAnswers: 0,
        totalQuestions: ticket.questions.length,
        answeredQuestions: [],
        mistakesDetails: [],
        completedAt: null
      };

      if (ticketProgressIndex !== -1) {
        // Если билет существует и завершен, удаляем старый прогресс
        if (user.ticketsProgress[ticketProgressIndex].isCompleted) {
          user.ticketsProgress.splice(ticketProgressIndex, 1);
          user.ticketsProgress.push(newTicketProgress); // Добавляем новый прогресс в конец
          console.log(`🔄 Сброс завершенного билета ${number}, новый прогресс добавлен`);
        } else {
          // Если билет не завершен, просто обновляем startedAt, если нужно
          if (!user.ticketsProgress[ticketProgressIndex].startedAt) {
            user.ticketsProgress[ticketProgressIndex].startedAt = new Date();
          }
        }
      } else {
        // Если билета нет, добавляем новый прогресс
        user.ticketsProgress.push(newTicketProgress);
      }

      await user.save();
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

      let correctAnswersDelta = 0;
      let mistakesDelta = 0;
      const detailedResults = [];

      let ticketProgress = user.ticketsProgress.find(tp => tp.ticketNumber === number);
      if (!ticketProgress) {
        // Если прогресса нет, создаем новый
        ticketProgress = {
          ticketNumber: number,
          startedAt: new Date(),
          isCompleted: false,
          mistakes: 0,
          correctAnswers: 0,
          totalQuestions: ticket.questions.length,
          answeredQuestions: [],
          mistakesDetails: [],
          completedAt: null
        };
        user.ticketsProgress.push(ticketProgress);
        console.log('➕ Добавлен новый прогресс по билету:', ticketProgress);
      } else if (ticketProgress.isCompleted) {
        // Если билет завершен, сбрасываем прогресс
        const ticketProgressIndex = user.ticketsProgress.findIndex(tp => tp.ticketNumber === number);
        ticketProgress = {
          ticketNumber: number,
          startedAt: new Date(),
          isCompleted: false,
          mistakes: 0,
          correctAnswers: 0,
          totalQuestions: ticket.questions.length,
          answeredQuestions: [],
          mistakesDetails: [],
          completedAt: null
        };
        user.ticketsProgress.splice(ticketProgressIndex, 1);
        user.ticketsProgress.push(ticketProgress);
        console.log(`🔄 Сброс завершенного билета ${number} при отправке, новый прогресс добавлен`);
      }

      answers.forEach(answer => {
        // Пропускаем уже отвеченные вопросы только для незавершенных билетов
        if (!ticketProgress.isCompleted) {
          const alreadyAnswered = ticketProgress.answeredQuestions.find(
            q => q.questionId === answer.questionId
          );
          if (alreadyAnswered) {
            console.log(`⚠️ Вопрос ${answer.questionId} уже был отвечен ранее`);
            return;
          }
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
            isCorrect: false,
            hint: null,
            imageUrl: null,
            videoUrl: null
          });
          ticketProgress.mistakesDetails.push({
            questionId: answer.questionId,
            questionText: 'Вопрос не найден',
            selectedOption: answer.selectedOption,
            correctOption: 'Неизвестно',
            hint: null,
            imageUrl: null,
            videoUrl: null
          });
          return;
        }

        const correctOption = question.options.find(opt => opt.isCorrect);
        const isCorrect = correctOption && answer.selectedOption === correctOption.text;

        if (isCorrect) {
          correctAnswersDelta++;
        } else {
          mistakesDelta++;
          ticketProgress.mistakesDetails.push({
            questionId: answer.questionId,
            questionText: question.text,
            selectedOption: answer.selectedOption,
            correctOption: correctOption.text,
            hint: question.hint || null,
            imageUrl: question.imageUrl || null,
            videoUrl: question.videoUrl || null
          });
        }

        detailedResults.push({
          questionId: answer.questionId,
          selectedOption: answer.selectedOption,
          isCorrect
        });

        ticketProgress.answeredQuestions.push({
          questionId: answer.questionId,
          selectedOption: answer.selectedOption,
          isCorrect,
          hint: question.hint || null,
          imageUrl: question.imageUrl || null,
          videoUrl: null
        });

        console.log(`📘 Вопрос ${question._id}: ответ "${answer.selectedOption}", правильный: "${correctOption?.text}", результат: ${isCorrect}, hint: "${question.hint || 'нет'}", imageUrl: "${question.imageUrl || 'нет'}"`);
      });

      ticketProgress.correctAnswers += correctAnswersDelta;
      ticketProgress.mistakes += mistakesDelta;

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

      const allTickets = await Ticket.find().select('number videoUrl');
      const totalTickets = allTickets.length;
      const ticketsCompleted = user.ticketsProgress.filter(tp => tp.isCompleted).length;
      const totalMistakes = user.stats.mistakes;

      let nextTicket = 1;
      for (let i = 1; i <= totalTickets; i++) {
        const ticketProgress = user.ticketsProgress.find(tp => tp.ticketNumber === i);
        if (!ticketProgress || !ticketProgress.isCompleted) {
          nextTicket = i;
          break;
        }
      }

      // Формируем ticketsProgress, добавляя videoUrl из Ticket
      const ticketsProgress = user.ticketsProgress.map(tp => {
        const ticket = allTickets.find(t => t.number === tp.ticketNumber);
        return {
          ticketNumber: tp.ticketNumber,
          isCompleted: tp.isCompleted,
          mistakes: tp.mistakes,
          correctAnswers: tp.correctAnswers,
          totalQuestions: tp.totalQuestions,
          completedAt: tp.completedAt,
          timeSpent: tp.startedAt && tp.completedAt
            ? (new Date(tp.completedAt) - new Date(tp.startedAt)) / 1000 // Время в секундах
            : null,
          mistakesDetails: tp.mistakesDetails,
          answeredQuestions: tp.answeredQuestions.map(answer => ({
            questionId: answer.questionId,
            selectedOption: answer.selectedOption,
            isCorrect: answer.isCorrect,
            hint: answer.hint,
            imageUrl: answer.imageUrl,
            videoUrl: answer.videoUrl
          })),
          videoUrl: ticket ? ticket.videoUrl : null // Добавляем videoUrl билета
        };
      });

      return {
        totalTickets,
        ticketsCompleted,
        totalMistakes,
        ticketsProgress,
        nextTicket
      };
    } catch (error) {
      throw new Error(`Ошибка при получении прогресса: ${error.message}`);
    }
  }
}

module.exports = new TicketService();