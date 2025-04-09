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
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: ID билета
 *                   number:
 *                     type: integer
 *                     description: Номер билета
 *                   questions:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           description: ID вопроса
 *                         text:
 *                           type: string
 *                           description: Текст вопроса
 *                         imageUrl:
 *                           type: string
 *                           description: URL изображения (если есть)
 *                         options:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               text:
 *                                 type: string
 *                                 description: Текст варианта ответа
 *                               isCorrect:
 *                                 type: boolean
 *                                 description: Является ли вариант правильным
 *                         hint:
 *                           type: string
 *                           description: Подсказка (если есть)
 *                         videoUrl:
 *                           type: string
 *                           description: URL видео (если есть)
 *                         category:
 *                           type: string
 *                           description: Категория вопроса
 *                         questionNumber:
 *                           type: integer
 *                           description: Номер вопроса в билете
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
 *         description: Номер билета
 *     responses:
 *       200:
 *         description: Данные билета
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: ID билета
 *                 number:
 *                   type: integer
 *                   description: Номер билета
 *                 questions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: ID вопроса
 *                       text:
 *                         type: string
 *                         description: Текст вопроса
 *                       imageUrl:
 *                         type: string
 *                         description: URL изображения (если есть)
 *                       options:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             text:
 *                               type: string
 *                               description: Текст варианта ответа
 *                             isCorrect:
 *                               type: boolean
 *                               description: Является ли вариант правильным
 *                       hint:
 *                         type: string
 *                         description: Подсказка (если есть)
 *                       videoUrl:
 *                         type: string
 *                         description: URL видео (если есть)
 *                       category:
 *                         type: string
 *                         description: Категория вопроса
 *                       questionNumber:
 *                         type: integer
 *                         description: Номер вопроса в билете
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
 *         description: Категория вопросов
 *     responses:
 *       200:
 *         description: Список вопросов по категории
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: ID вопроса
 *                   text:
 *                     type: string
 *                     description: Текст вопроса
 *                   imageUrl:
 *                     type: string
 *                     description: URL изображения (если есть)
 *                   options:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         text:
 *                           type: string
 *                           description: Текст варианта ответа
 *                         isCorrect:
 *                           type: boolean
 *                           description: Является ли вариант правильным
 *                   hint:
 *                     type: string
 *                     description: Подсказка (если есть)
 *                   videoUrl:
 *                     type: string
 *                     description: URL видео (если есть)
 *                   category:
 *                     type: string
 *                     description: Категория вопроса
 *                   questionNumber:
 *                     type: integer
 *                     description: Номер вопроса в билете
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
 *         description: Количество вопросов (по умолчанию 20)
 *     responses:
 *       200:
 *         description: Список случайных вопросов
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: ID вопроса
 *                   text:
 *                     type: string
 *                     description: Текст вопроса
 *                   imageUrl:
 *                     type: string
 *                     description: URL изображения (если есть)
 *                   options:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         text:
 *                           type: string
 *                           description: Текст варианта ответа
 *                         isCorrect:
 *                           type: boolean
 *                           description: Является ли вариант правильным
 *                   hint:
 *                     type: string
 *                     description: Подсказка (если есть)
 *                   videoUrl:
 *                     type: string
 *                     description: URL видео (если есть)
 *                   category:
 *                     type: string
 *                     description: Категория вопроса
 *                   questionNumber:
 *                     type: integer
 *                     description: Номер вопроса в билете
 *       401:
 *         description: Не авторизован
 */
router.get('/random', isAuthenticated, ticketController.getRandomQuestions);

module.exports = router;