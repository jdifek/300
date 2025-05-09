const examService = require('../services/examService');
const ApiError = require('../exceptions/api-error');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const MarathonExam = require('../models/MarathonExam');

class ExamController {
  async getUnansweredQuestions(req, res, next) {
    try {
      const { examId } = req.params;
      const unansweredQuestions = await examService.getUnansweredQuestions(examId);
      res.json(unansweredQuestions);
    } catch (error) {
      next(error);
    }
  }

  async submitUnansweredQuestionAnswer(req, res, next) {
    try {
      const { examId } = req.params;
      const { questionIndex, userAnswer } = req.body;
      const marathonExam = await examService.processUnansweredQuestionAnswer(examId, questionIndex, userAnswer);
      res.json(marathonExam);
    } catch (error) {
      next(error);
    }
  }

  async getUnansweredResults(req, res, next) {
    try {
      const { examId } = req.params;
      const results = await examService.getUnansweredResults(examId);
      res.json(results);
    } catch (error) {
      next(error);
    }
  }

  async getAllMarathonStatistics(req, res, next) {
    try {
      const userId = req.user.id;
      if (!userId) {
        throw new ApiError(400, 'ID пользователя обязателен');
      }

      const marathonExams = await MarathonExam.find({ userId }).lean();
      if (!marathonExams.length) {
        return res.json({
          status: 'not_started',
          totalQuestions: 800,
          answeredQuestions: 0,
          correctAnswers: 0,
          mistakes: 0,
          questions: [],
          mistakesDetails: [],
          totalTimeSpent: 0,
          formattedTotalTimeSpent: '0 мин 0 сек'
        });
      }

      const allQuestions = marathonExams.flatMap(exam => exam.questions);
      const questionsWithDetails = allQuestions.map(q => {
        return {
          questionId: q.questionId._id,
          text: q.questionId.text || 'Вопрос не найден',
          options: q.questionId.options,
          hint: q.questionId.hint || null,
          imageUrl: q.questionId.imageUrl || null,
          videoUrl: q.questionId.videoUrl || null,
          category: q.questionId.category || null,
          questionNumber: q.questionId.questionNumber || null,
          userAnswer: q.userAnswer,
          isCorrect: q.isCorrect
        };
      });

      const answeredQuestions = allQuestions.filter(q => q.userAnswer !== null).length;
      const correctAnswers = allQuestions.filter(q => q.isCorrect === true).length;
      const mistakes = allQuestions.filter(q => q.isCorrect === false).length;

      const totalTimeSpent = marathonExams.reduce((total, exam) => {
        const startTime = exam.startTime.getTime();
        const endTime = exam.completedAt ? exam.completedAt.getTime() : Date.now();
        return total + Math.floor((endTime - startTime) / 1000);
      }, 0);

      const minutes = Math.floor(totalTimeSpent / 60);
      const seconds = totalTimeSpent % 60;
      const formattedTotalTimeSpent = `${minutes} мин ${seconds} сек`;

      const mistakesDetails = allQuestions
        .filter(q => q.isCorrect === false)
        .map(q => ({
          questionId: q.questionId._id,
          questionText: q.questionId.text || 'Вопрос не найден',
          selectedOption: q.questionId.options[q.userAnswer]?.text || 'Неизвестный ответ',
          correctOption: q.questionId.options.find(opt => opt.text === q.questionId.options.find(o => o.isCorrect)?.text)?.text || 'Неизвестный ответ',
          hint: q.questionId.hint || null,
          imageUrl: q.questionId.imageUrl || null
        }));

      res.json({
        status: marathonExams.some(exam => exam.status === 'in_progress') ? 'in_progress' : 'completed',
        totalQuestions: 800,
        answeredQuestions,
        correctAnswers,
        mistakes,
        questions: questionsWithDetails,
        mistakesDetails,
        totalTimeSpent,
        formattedTotalTimeSpent
      });
    } catch (error) {
      next(error);
    }
  }

  async get5question(req, res) {
    try {
      const category = req.query.category;
      const tickets = await Ticket.find({ 'questions.category': category }).lean();
      const questions = tickets.flatMap(ticket =>
        ticket.questions
          .filter(question => question.category === category)
          .slice(0, 5)
      ).slice(0, 5);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async getAllQuestionsByCategory(req, res) {
    try {
      const category = req.query.category;
      const tickets = await Ticket.find({ 'questions.category': category }).lean();
      const questions = tickets.flatMap(ticket =>
        ticket.questions
          .filter(question => question.category === category)
      );
      res.json(questions);
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
      const userId = req.user.id;
      const progress = await examService.getMarathonProgress(userId);
      res.json(progress);
    } catch (error) {
      next(error);
    }
  }

  async getCurrentMarathonAllProgress(req, res, next) {
    try {
      const userId = req.user.id;
      if (!userId) {
        throw new ApiError(400, 'ID пользователя обязателен');
      }

      const marathonExam = await MarathonExam.findOne({ userId, status: 'in_progress' });
      if (!marathonExam) {
        return res.json({
          status: 'not_started',
          totalQuestions: 800,
          answeredQuestions: 0,
          correctAnswers: 0,
          mistakes: 0,
          questions: [],
          mistakesDetails: [],
          timeSpent: 0,
          formattedTimeSpent: '0 мин 0 сек'
        });
      }

      const tickets = await Ticket.find().lean();
      if (!tickets.length) {
        throw new ApiError(404, 'Билеты не найдены');
      }

      const questionsWithDetails = marathonExam.questions.map(q => {
        const ticket = tickets.find(t => t.questions.some(tq => tq._id.toString() === q.questionId.toString()));
        const ticketQuestion = ticket?.questions.find(tq => tq._id.toString() === q.questionId.toString());
        return {
          questionId: q.questionId,
          text: ticketQuestion?.text || 'Вопрос не найден',
          options: (ticketQuestion?.options || []).map(opt => ({ text: opt.text })),
          hint: ticketQuestion?.hint || null,
          imageUrl: ticketQuestion?.imageUrl || null,
          videoUrl: ticketQuestion?.videoUrl || null,
          category: ticketQuestion?.category || null,
          questionNumber: ticketQuestion?.questionNumber || null,
          userAnswer: q.userAnswer,
          isCorrect: q.isCorrect
        };
      });

      const totalQuestions = 800;
      const answeredQuestions = marathonExam.completedQuestions || 0;
      const correctAnswers = marathonExam.questions.filter(q => q.isCorrect === true).length;
      const timeSpent = marathonExam.startTime
        ? marathonExam.completedAt
          ? Math.floor((marathonExam.completedAt.getTime() - marathonExam.startTime.getTime()) / 1000)
          : Math.floor((Date.now() - marathonExam.startTime.getTime()) / 1000)
        : 0;

      const minutes = Math.floor(timeSpent / 60);
      const seconds = timeSpent % 60;
      const formattedTimeSpent = `${minutes} мин ${seconds} сек`;

      res.json({
        status: marathonExam.status,
        totalQuestions,
        answeredQuestions,
        correctAnswers,
        mistakes: marathonExam.mistakes || 0,
        questions: questionsWithDetails,
        mistakesDetails: marathonExam.mistakesDetails || [],
        timeSpent,
        formattedTimeSpent
      });
    } catch (error) {
      next(error);
    }
  }

  async getMarathonResults(req, res, next) {
    try {
      const { examId } = req.params;
      const results = await examService.getMarathonResults(examId);
      res.json(results);
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
      const { isPremium } = req.user;
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

  async getRandomQuestions(req, res, next) {
    try {
      const category = req.query.category;
      const userId = req.user.id;
      if (!userId) {
        throw new ApiError(400, 'ID пользователя обязателен');
      }
      const tickets = await Ticket.find({ 'questions.category': category }).lean();
      const allQuestions = tickets.flatMap(ticket =>
        ticket.questions
          .filter(question => question.category === category)
          .map(question => ({
            ...question,
            ticketNumber: ticket.number
          }))
      );
      const randomQuestions = allQuestions.sort(() => 0.5 - Math.random()).slice(0, 5);
      const sessionId = await examService.createRandomQuestionSession(userId, randomQuestions);
      res.json({ sessionId, questions: randomQuestions });
    } catch (error) {
      next(error);
    }
  }

  async submitRandomQuestionAnswer(req, res, next) {
    try {
      const { sessionId, questionId, userAnswer } = req.body;
      const userId = req.user.id;
      if (!userId || !sessionId || !questionId || userAnswer === undefined) {
        throw new ApiError(400, 'Необходимы userId, sessionId, questionId и userAnswer');
      }
      const result = await examService.processRandomQuestionAnswer(userId, sessionId, questionId, userAnswer);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getNewQuestions(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'Пользователь не аутентифицирован' });
      }

      const tickets = await Ticket.find().lean();
      if (!tickets.length) {
        return res.status(404).json({ message: 'Билеты не найдены' });
      }

      const user = await User.findById(userId).lean();
      if (!user) {
        return res.status(404).json({ message: 'Пользователь не найден' });
      }

      const completedTicketNumbers = user.ticketsProgress?.map(ticket => ticket.ticketNumber) || [];

      const newQuestions = tickets.flatMap(ticket => {
        if (!completedTicketNumbers.includes(ticket.number)) {
          return ticket.questions.map(question => ({
            questionId: question._id.toString(),
            questionText: question.text || 'Вопрос отсутствует',
            options: question.options || [],
            category: question.category || 'Без категории',
            hint: question.hint || null,
            imageUrl: question.imageUrl || null,
            videoUrl: question.videoUrl || null,
            questionNumber: question.questionNumber || null
          }));
        }
        return [];
      });

      res.json(newQuestions.length ? newQuestions : []);
    } catch (error) {
      console.error('Ошибка в getNewQuestions:', error);
      res.status(500).json({ message: `Ошибка сервера: ${error.message}` });
    }
  }
}

module.exports = new ExamController();