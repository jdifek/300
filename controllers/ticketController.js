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
}

module.exports = new TicketController(); 