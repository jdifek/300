const examService = require('../services/examService');
const ApiError = require('../exceptions/api-error');

class ExamController {
  async startExam(req, res, next) {
    try {
      const { userId } = req.body;
      const exam = await examService.createExam(userId);
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

  async selectTicket(req, res, next) {
    try {
      const { ticketId } = req.body; // Получаем ticketId из тела запроса
      // Здесь можно добавить логику для обработки выбора билета
      // Например, сохранить выбранный билет в базе данных или сессии
      res.json({ message: 'Билет выбран', ticketId }); // Возвращаем подтверждение
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ExamController(); 