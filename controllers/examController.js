const examService = require('../services/examService');
const ApiError = require('../exceptions/api-error');

class ExamController {
  async marafon(req, res, next) {
    try {
      const answers = await examService.getAnswers();
      res.json(answers);
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

}

module.exports = new ExamController(); 