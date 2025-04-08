const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const ticketController = require('../controllers/ticketController');
const { isAuthenticated } = require('../middleware/auth');

/**
 * @swagger
 * /api/tickets:
 *   get:
 *     summary: Получить все билеты
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список билетов
 *       401:
 *         description: Не авторизован
 */
router.get('/', isAuthenticated, ticketController.getAllTickets);

/**
 * @swagger
 * /api/tickets/{number}:
 *   get:
 *     summary: Получить билет по номеру
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: number
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Билет
 *       404:
 *         description: Билет не найден
 *       401:
 *         description: Не авторизован
 */
router.get('/:number', isAuthenticated, ticketController.getTicketByNumber);

/**
 * @swagger
 * /api/tickets/category/{category}:
 *   get:
 *     summary: Получить вопросы по категории
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Список вопросов
 *       401:
 *         description: Не авторизован
 */
router.get('/category/:category', isAuthenticated, ticketController.getQuestionsByCategory);

/**
 * @swagger
 * /api/tickets/random:
 *   get:
 *     summary: Получить случайные вопросы
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: count
 *         schema:
 *           type: integer
 *         description: Количество вопросов
 *     responses:
 *       200:
 *         description: Список случайных вопросов
 *       401:
 *         description: Не авторизован
 */
router.get('/random', isAuthenticated, ticketController.getRandomQuestions);

module.exports = router;