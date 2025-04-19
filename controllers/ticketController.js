const ticketService = require('../services/ticketService');
const ApiError = require('../exceptions/api-error');

class TicketController {
  async getAllTickets(req, res, next) {
    try {
      const tickets = await ticketService.getAllTickets();
      res.json(tickets);
    } catch (error) {
      next(error);
    }
  }

  async getTicketByNumber(req, res, next) {
    try {
      const { number } = req.params;
      const ticket = await ticketService.getTicketByNumber(parseInt(number));
      res.json(ticket);
    } catch (error) {
      next(error);
    }
  }

  async getQuestionsByCategory(req, res, next) {
    try {
      const { category } = req.params;
      const questions = await ticketService.getQuestionsByCategory(category);
      res.json(questions);
    } catch (error) {
      next(error);
    }
  }

  async getRandomQuestions(req, res, next) {
    try {
      const { count } = req.query;
      const questions = await ticketService.getRandomQuestions(parseInt(count) || 20);
      res.json(questions);
    } catch (error) {
      next(error);
    }
  }

  async startTicket(req, res, next) {
    try {
      const { number } = req.params;
      const userId = req.user.id; // Предполагается, что middleware isAuthenticated добавляет user в req
      const ticket = await ticketService.startTicket(parseInt(number), userId);
      res.json({ message: 'Ticket started successfully', ticket });
    } catch (error) {
      next(error);
    }
  }

  async submitTicket(req, res, next) {
    try {
      const { number } = req.params;
      const { answers } = req.body;
      const userId = req.user.id;
      const results = await ticketService.submitTicket(parseInt(number), userId, answers);
      res.json({ message: 'Ticket submitted successfully', results });
    } catch (error) {
      next(error);
    }
  }

  async getTicketProgress(req, res, next) {
    try {
      const userId = req.user.id;
      const progress = await ticketService.getTicketProgress(userId);
      res.json(progress);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TicketController();