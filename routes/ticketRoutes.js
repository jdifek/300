const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const ticketController = require('../controllers/ticketController');
const { isAuthenticated } = require('../middleware/auth');

/**
 * @swagger
 * /api/tickets/progress:
 *   get:
 *     summary: Получить прогресс пользователя по билетам
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Прогресс пользователя по билетам
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalTickets:
 *                   type: integer
 *                   description: Общее количество билетов
 *                 ticketsCompleted:
 *                   type: integer
 *                   description: Количество пройденных билетов
 *                 totalMistakes:
 *                   type: integer
 *                   description: Общее количество ошибок
 *                 ticketsProgress:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       ticketNumber:
 *                         type: integer
 *                         description: Номер билета
 *                       isCompleted:
 *                         type: boolean
 *                         description: Завершён ли билет
 *                       mistakes:
 *                         type: integer
 *                         description: Количество ошибок
 *                       correctAnswers:
 *                         type: integer
 *                         description: Количество правильных ответов
 *                       totalQuestions:
 *                         type: integer
 *                         description: Общее количество вопросов
 *                       completedAt:
 *                         type: string
 *                         format: date-time
 *                         description: Дата завершения билета
 *                         nullable: true
 *                       timeSpent:
 *                         type: number
 *                         description: Время, затраченное на прохождение билета (в секундах)
 *                         nullable: true
 *                       mistakesDetails:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             questionId:
 *                               type: string
 *                               description: ID вопроса
 *                             questionText:
 *                               type: string
 *                               description: Текст вопроса
 *                             selectedOption:
 *                               type: string
 *                               description: Выбранный пользователем ответ
 *                             correctOption:
 *                               type: string
 *                               description: Правильный ответ
 *                         description: Подробности о допущенных ошибках
 *                       answeredQuestions:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             questionId:
 *                               type: string
 *                               description: ID вопроса
 *                             selectedOption:
 *                               type: string
 *                               description: Выбранный пользователем ответ
 *                             isCorrect:
 *                               type: boolean
 *                               description: Правильность ответа
 *                         description: Список отвеченных вопросов
 *                 nextTicket:
 *                   type: integer
 *                   description: Номер следующего билета для прохождения
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Ошибка сервера
 */
router.get('/progress', isAuthenticated, ticketController.getTicketProgress);


/**
 * @swagger
 * /api/tickets/categories:
 *   get:
 *     summary: Получить все категории вопросов
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список категорий вопросов
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *                 description: Название категории
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Ошибка сервера
 */
router.get('/categories', isAuthenticated, ticketController.getAllCategories);
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
 *                           nullable: true
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
 *                           nullable: true
 *                         videoUrl:
 *                           type: string
 *                           description: URL видео (если есть)
 *                           nullable: true
 *                         category:
 *                           type: string
 *                           description: Категория вопроса
 *                         questionNumber:
 *                           type: integer
 *                           description: Номер вопроса в билете
 *                   videoUrl:
 *                     type: string
 *                     description: URL видео для билета (если есть)
 *                     nullable: true
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Ошибка сервера
 */
router.get('/', isAuthenticated, ticketController.getAllTickets);

/**
 * @swagger
 * /api/tickets/progress:
 *   get:
 *     summary: Получить прогресс пользователя по билетам
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Прогресс пользователя по билетам
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalTickets:
 *                   type: integer
 *                 ticketsCompleted:
 *                   type: integer
 *                 totalMistakes:
 *                   type: integer
 *                 ticketsProgress:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       ticketNumber:
 *                         type: integer
 *                       isCompleted:
 *                         type: boolean
 *                       mistakes:
 *                         type: integer
 *                       correctAnswers:
 *                         type: integer
 *                       totalQuestions:
 *                         type: integer
 *                       completedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       timeSpent:
 *                         type: number
 *                         nullable: true
 *                       mistakesDetails:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             questionId:
 *                               type: string
 *                             questionText:
 *                               type: string
 *                             selectedOption:
 *                               type: string
 *                             correctOption:
 *                               type: string
 *                       answeredQuestions:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             questionId:
 *                               type: string
 *                             selectedOption:
 *                               type: string
 *                             isCorrect:
 *                               type: boolean
 *                 nextTicket:
 *                   type: integer
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Ошибка сервера
 */
router.get('/progress', isAuthenticated, ticketController.getTicketProgress);

/**
 * @swagger
 * /api/tickets/category/progress:
 *   get:
 *     summary: Получить прогресс пользователя по категориям вопросов
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Прогресс пользователя по категориям
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalCategories:
 *                   type: integer
 *                   description: Общее количество категорий
 *                 categoriesProgress:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category:
 *                         type: string
 *                         description: Название категории
 *                       totalQuestions:
 *                         type: integer
 *                         description: Общее количество вопросов в категории
 *                       correctAnswers:
 *                         type: integer
 *                         description: Количество правильных ответов
 *                       mistakes:
 *                         type: integer
 *                         description: Количество ошибок
 *                       startedAt:
 *                         type: string
 *                         format: date-time
 *                         description: Дата начала работы с категорией
 *                         nullable: true
 *                       answeredQuestions:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             questionId:
 *                               type: string
 *                             selectedOption:
 *                               type: string
 *                             isCorrect:
 *                               type: boolean
 *                             hint:
 *                               type: string
 *                             imageUrl:
 *                               type: string
 *                             videoUrl:
 *                               type: string
 *                       mistakesDetails:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             questionId:
 *                               type: string
 *                             questionText:
 *                               type: string
 *                             selectedOption:
 *                               type: string
 *                             correctOption:
 *                               type: string
 *                             hint:
 *                               type: string
 *                             imageUrl:
 *                               type: string
 *                             videoUrl:
 *                               type: string
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Ошибка сервера
 */
router.get('/category/progress', isAuthenticated, ticketController.getCategoryProgress);

/**
 * @swagger
 * /api/tickets/category/{category}/start:
 *   post:
 *     summary: Начать работу с категорией вопросов
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         description: Название категории
 *     responses:
 *       200:
 *         description: Категория успешно начата
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Category started successfully"
 *                 category:
 *                   type: string
 *                 totalQuestions:
 *                   type: integer
 *       404:
 *         description: Категория не найдена
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Ошибка сервера
 */
router.post('/category/:category/start', isAuthenticated, ticketController.startCategory);

/**
 * @swagger
 * /api/tickets/category/{category}/submit:
 *   post:
 *     summary: Отправить ответы на вопросы категории
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         description: Название категории
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     questionId:
 *                       type: string
 *                     selectedOption:
 *                       type: string
 *                 description: Ответы пользователя
 *     responses:
 *       200:
 *         description: Результаты отправки ответов
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Category answers submitted successfully"
 *                 results:
 *                   type: object
 *                   properties:
 *                     category:
 *                       type: string
 *                     totalQuestions:
 *                       type: integer
 *                     correctAnswers:
 *                       type: integer
 *                     mistakes:
 *                       type: integer
 *                     successRate:
 *                       type: number
 *                     answers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           questionId:
 *                             type: string
 *                           selectedOption:
 *                             type: string
 *                           isCorrect:
 *                             type: boolean
 *       404:
 *         description: Категория не найдена
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Ошибка сервера
 */
router.post('/category/:category/submit', isAuthenticated, ticketController.submitCategory);

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
 *       500:
 *         description: Ошибка сервера
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
 *       500:
 *         description: Ошибка сервера
 */
router.get('/random', isAuthenticated, ticketController.getRandomQuestions);

/**
 * @swagger
 * /api/tickets/random-ticket:
 *   get:
 *     summary: Получить случайный билет
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Случайный билет
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
 *                         nullable: true
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
 *                         nullable: true
 *                       videoUrl:
 *                         type: string
 *                         description: URL видео (если есть)
 *                         nullable: true
 *                       category:
 *                         type: string
 *                         description: Категория вопроса
 *                       questionNumber:
 *                         type: integer
 *                         description: Номер вопроса в билете
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Ошибка сервера
 */
router.get('/random-ticket', isAuthenticated, ticketController.getRandomTicket);
/**
 * @swagger
 * /api/tickets/random-ticket/submit:
 *   post:
 *     summary: Отправить ответы на вопросы случайного билета и получить результаты
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ticketNumber:
 *                 type: integer
 *                 description: Номер случайного билета
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     questionId:
 *                       type: string
 *                       description: ID вопроса
 *                     selectedOption:
 *                       type: string
 *                       description: Текст выбранного варианта ответа
 *                 description: Ответы пользователя на вопросы билета
 *     responses:
 *       200:
 *         description: Результаты прохождения случайного билета
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Сообщение об успешной отправке
 *                   example: "Random ticket submitted successfully"
 *                 results:
 *                   type: object
 *                   properties:
 *                     ticketNumber:
 *                       type: integer
 *                       description: Номер билета
 *                     totalQuestions:
 *                       type: integer
 *                       description: Общее количество вопросов
 *                     correctAnswers:
 *                       type: integer
 *                       description: Количество правильных ответов
 *                     mistakes:
 *                       type: integer
 *                       description: Количество ошибок
 *                     successRate:
 *                       type: number
 *                       description: Процент успешности
 *                     answers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           questionId:
 *                             type: string
 *                             description: ID вопроса
 *                           selectedOption:
 *                             type: string
 *                             description: Выбранный вариант ответа
 *                           isCorrect:
 *                             type: boolean
 *                             description: Правильный ли ответ
 *       404:
 *         description: Билет не найден
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Ошибка сервера
 */
router.post('/random-ticket/submit', isAuthenticated, ticketController.submitRandomTicket);
/**
 * @swagger
 * /api/tickets/{number}/start:
 *   post:
 *     summary: Начать прохождение билета
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
 *         description: Билет успешно начат
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Сообщение об успешном начале
 *                   example: "Ticket started successfully"
 *                 ticket:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: ID билета
 *                     number:
 *                       type: integer
 *                       description: Номер билета
 *                     questions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: ID вопроса
 *                           text:
 *                             type: string
 *                             description: Текст вопроса
 *                           imageUrl:
 *                             type: string
 *                             description: URL изображения (если есть)
 *                             nullable: true
 *                           options:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 text:
 *                                   type: string
 *                                   description: Текст варианта ответа
 *                                 isCorrect:
 *                                   type: boolean
 *                                   description: Является ли вариант правильным
 *                           hint:
 *                             type: string
 *                             description: Подсказка (если есть)
 *                             nullable: true
 *                           videoUrl:
 *                             type: string
 *                             description: URL видео (если есть)
 *                             nullable: true
 *                           category:
 *                             type: string
 *                             description: Категория вопроса
 *                           questionNumber:
 *                             type: integer
 *                             description: Номер вопроса в билете
 *                     videoUrl:
 *                       type: string
 *                       description: URL видео для билета (если есть)
 *                       nullable: true
 *       404:
 *         description: Билет не найден
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Ошибка сервера
 */
router.post('/:number/start', isAuthenticated, ticketController.startTicket);
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
 *                         nullable: true
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
 *                         nullable: true
 *                       videoUrl:
 *                         type: string
 *                         description: URL видео (если есть)
 *                         nullable: true
 *                       category:
 *                         type: string
 *                         description: Категория вопроса
 *                       questionNumber:
 *                         type: integer
 *                         decine: Номер вопроса в билете
 *                 videoUrl:
 *                   type: string
 *                   description: URL видео для билета (если есть)
 *                   nullable: true
 *       404:
 *         description: Билет не найден
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Ошибка сервера
 */
router.get('/:number', isAuthenticated, ticketController.getTicketByNumber);
/**
 * @swagger
 * /api/tickets/{number}/submit:
 *   post:
 *     summary: Отправить ответы на вопросы билета и получить результаты
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     questionId:
 *                       type: string
 *                       description: ID вопроса
 *                     selectedOption:
 *                       type: string
 *                       description: Текст выбранного варианта ответа
 *                 description: Ответы пользователя на вопросы билета
 *     responses:
 *       200:
 *         description: Результаты прохождения билета
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Сообщение об успешной отправке
 *                   example: "Ticket submitted successfully"
 *                 results:
 *                   type: object
 *                   properties:
 *                     ticketNumber:
 *                       type: integer
 *                       description: Номер билета
 *                     totalQuestions:
 *                       type: integer
 *                       description: Общее количество вопросов
 *                     correctAnswers:
 *                       type: integer
 *                       description: Количество правильных ответов
 *                     mistakes:
 *                       type: integer
 *                       description: Количество ошибок
 *                     successRate:
 *                       type: number
 *                       description: Процент успешности
 *                     answers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           questionId:
 *                             type: string
 *                             description: ID вопроса
 *                           selectedOption:
 *                             type: string
 *                             description: Выбранный вариант ответа
 *                           isCorrect:
 *                             type: boolean
 *                             description: Правильный ли ответ
 *       404:
 *         description: Билет не найден
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Ошибка сервера
 */
router.post('/:number/submit', isAuthenticated, ticketController.submitTicket);


module.exports = router;