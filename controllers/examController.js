const examService = require('../services/examService');
const ApiError = require('../exceptions/api-error');
const Ticket = require('../models/Ticket');
const User = require('../models/User');


class ExamController {
  async get5question(req, res) {
    try {
      const category = req.query.category; // Получаем категорию из параметров запроса

      // Находим билеты, которые соответствуют выбранной категории
      const tickets = await Ticket.find({ 'questions.category': category }).lean();

      // Извлекаем 5 вопросов из найденных билетов
      const questions = tickets.flatMap(ticket =>
        ticket.questions
          .filter(question => question.category === category) // Фильтруем по категории
          .slice(0, 5) // Берем только первые 5 вопросов
      ).slice(0, 5); // Если вопросов больше 5, берем только 5

      res.json(questions); // Возвращаем вопросы
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  async getAllQuestionsByCategory(req, res) {
    try {
      const category = req.query.category; // Получаем категорию из параметров запроса

      // Находим билеты, которые соответствуют выбранной категории
      const tickets = await Ticket.find({ 'questions.category': category }).lean();

      // Извлекаем все вопросы из найденных билетов
      const questions = tickets.flatMap(ticket =>
        ticket.questions
          .filter(question => question.category === category) // Фильтруем по категории
      );

      res.json(questions); // Возвращаем все вопросы
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async marafon(req, res, next) {
    try {
      const answers = await examService.getAnswers();
      res.json(answers);
    } catch (error) {
      next(error);
    }
  }

  async startMarathon(req, res, next) {
    try {
      const { userId } = req.body;
      if (!userId) {
        throw new ApiError(400, 'ID пользователя обязателен');
      }
      const result = await examService.createMarathonExam(userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async submitMarathonAnswer(req, res, next) {
    try {
      const { examId } = req.params;
      const { questionIndex, userAnswer } = req.body;
      const marathonExam = await examService.processMarathonAnswer(examId, questionIndex, userAnswer);
      res.json(marathonExam);
    } catch (error) {
      next(error);
    }
  }

  async getMarathonProgress(req, res, next) {
    try {
      const { userId } = req.user; // Предполагаем, что userId доступен через middleware
      const progress = await examService.getMarathonProgress(userId);
      res.json(progress);
    } catch (error) {
      next(error);
    }
  }
  async selectTicket(req, res, next) {
    try {
      const { userId } = req.body;
      if (!userId) {
        throw new ApiError(400, 'ID пользователя обязателен');
      }
      const result = await examService.selectTicket(userId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async startExam(req, res, next) {
    try {
      const { userId, ticketNumber } = req.body;
      if (!ticketNumber) {
        throw new ApiError(400, 'Номер билета обязателен');
      }
      const exam = await examService.createExam(userId, ticketNumber);
      res.json(exam);
    } catch (error) {
      next(error);
    }
  }

  async submitAnswer(req, res, next) {
    try {
      const { examId } = req.params;
      const { questionIndex, userAnswer } = req.body;
      const exam = await examService.processAnswer(examId, questionIndex, userAnswer);
      res.json(exam);
    } catch (error) {
      next(error);
    }
  }

  async getExamStatus(req, res, next) {
    try {
      const { examId } = req.params;
      const exam = await examService.getExamResults(examId);
      res.json(exam);
    } catch (error) {
      next(error);
    }
  }

  async getShareTemplate(req, res, next) {
    try {
      const { examId } = req.params;
      const { isPremium } = req.user; // Предполагаем, что isPremium есть в объекте пользователя
      const template = await examService.generateShareTemplate(examId, isPremium);
      res.json(template);
    } catch (error) {
      next(error);
    }
  }

  async getResults(req, res, next) {
    try {
      const { examId } = req.params;
      const results = await examService.getExamResults(examId);
      res.json(results);
    } catch (error) {
      next(error);
    }
  }

  async getRandomQuestions(req, res) {
    try {
      const category = req.query.category; // Получаем категорию из параметров запроса

      // Находим билеты, которые соответствуют выбранной категории
      const tickets = await Ticket.find({ 'questions.category': category }).lean();

      // Извлекаем все вопросы из найденных билетов
      const allQuestions = tickets.flatMap(ticket =>
        ticket.questions.filter(question => question.category === category) // Фильтруем по категории
      );

      // Перемешиваем вопросы и берем первые 5
      const randomQuestions = allQuestions.sort(() => 0.5 - Math.random()).slice(0, 5);

      res.json(randomQuestions); // Возвращаем случайные вопросы
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async getNewQuestions(req, res) {
    try {
      const userId = req.user.id; // Получаем ID пользователя из запроса
      const tickets = await Ticket.find().lean(); // Получаем все билеты

      // Получаем прогресс пользователя по билетам
      const user = await User.findById(userId).lean();
      const completedTicketNumbers = user.ticketsProgress.map(ticket => ticket.ticketNumber); // Номера билетов, которые пользователь прошел

      // Извлекаем новые вопросы
      const newQuestions = tickets.flatMap(ticket => {
        if (!completedTicketNumbers.includes(ticket.number)) {
          return ticket.questions.map(question => ({
            questionId: question._id,
            questionText: question.text,
            options: question.options.map(opt => ({ text: opt.text })), // Исключаем isCorrect
            category: question.category
          }));
        }
        return [];
      });

      res.json(newQuestions); // Возвращаем новые вопросы
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

}

module.exports = new ExamController(); 