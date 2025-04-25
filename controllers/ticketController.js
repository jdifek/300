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

  async submitRandomTicket(req, res, next) {
    try {
      const { ticketNumber, answers } = req.body;
      const userId = req.user.id;
  
      // Проверяем, существует ли билет
      const ticket = await ticketService.getTicketByNumber(parseInt(ticketNumber));
      if (!ticket) {
        return res.status(404).json({ message: 'Билет не найден' });
      }
  
      // Проверяем, начат ли билет пользователем
      const user = await User.findById(userId);
      let ticketProgress = user.ticketsProgress.find(tp => tp.ticketNumber === ticketNumber);
      if (!ticketProgress) {
        // Если билет не начат, начинаем его
        await ticketService.startTicket(parseInt(ticketNumber), userId);
      }
  
      // Отправляем ответы и сохраняем прогресс
      const results = await ticketService.submitTicket(parseInt(ticketNumber), userId, answers);
  
      res.json({ message: 'Random ticket submitted successfully', results });
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

  async getRandomTicket(req, res, next) {
    try {
      const userId = req.user.id;
      const tickets = await ticketService.getAllTickets();
      if (tickets.length === 0) {
        return res.status(404).json({ message: 'Нет доступных билетов' });
      }
  
      // Выбираем случайный билет
      const randomIndex = Math.floor(Math.random() * tickets.length);
      const randomTicket = tickets[randomIndex];
  
      // Начинаем билет для пользователя
      await ticketService.startTicket(randomTicket.number, userId);
  
      res.json(randomTicket);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TicketController();