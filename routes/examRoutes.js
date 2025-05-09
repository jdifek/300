const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { validateExamStart, validateAnswer, validateExamId } = require('../middleware/examValidation');
const { isAuthenticated } = require('../middleware/auth');

/**
 * @swagger
 * /api/exam/marathon/progress:
 *   get:
 *     summary: Получить прогресс марафонского экзамена
 *     tags: [Exam]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Прогресс марафона
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: ['not_started', 'in_progress', 'completed']
 *                   description: Статус марафона
 *                 totalQuestions:
 *                   type: integer
 *                   description: Общее количество вопросов
 *                 progress:
 *                   type: integer
 *                   description: Процент правильных ответов
 *                 correctAnswers:
 *                   type: integer
 *                   description: Количество правильных ответов
 *                 mistakes:
 *                   type: integer
 *                   description: Количество ошибок
 *                 mistakesDetails:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       questionId:
 *                         type: string
 *                         description: ID вопроса
 *                       questionText:
 *                         type: string
 *                         description: Текст вопроса
 *                       selectedOption:
 *                         type: string
 *                         description: Выбранный пользователем ответ
 *                       correctOption:
 *                         type: string
 *                         description: Правильный ответ
 *                       hint:
 *                         type: string
 *                         nullable: true
 *                         description: Подсказка
 *                       imageUrl:
 *                         type: string
 *                         nullable: true
 *                         description: URL изображения
 *                   description: Подробности о допущенных ошибках
 *                 timeSpent:
 *                   type: integer
 *                   description: Время, затраченное на марафон (в секундах)
 *                 formattedTimeSpent:
 *                   type: string
 *                   description: Форматированное время (например, "15 мин 30 сек")
 *                 completedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *                   description: Время завершения марафона (null, если не завершён)
 *       401:
 *         description: Не авторизован
 */
router.get('/marathon/progress',
  isAuthenticated,
  examController.getMarathonProgress
);

/**
 * @swagger
 * /api/exam/marathon/all-statistics:
 *   get:
 *     summary: Получить статистику по всем 800 вопросам марафона
 *     description: Возвращает агрегированную статистику по всем марафонам пользователя, включая ответы и ошибки за все время.
 *     tags: [Exam]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Статистика по всем вопросам марафона
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: ['not_started', 'in_progress', 'completed']
 *                   description: Общий статус марафона (in_progress, если есть активный, иначе completed)
 *                 totalQuestions:
 *                   type: integer
 *                   description: Общее количество вопросов (фиксировано 800)
 *                 answeredQuestions:
 *                   type: integer
 *                   description: Общее количество отвеченных вопросов
 *                 correctAnswers:
 *                   type: integer
 *                   description: Общее количество правильных ответов
 *                 mistakes:
 *                   type: integer
 *                   description: Общее количество ошибок
 *                 questions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       questionId:
 *                         type: string
 *                         description: ID вопроса
 *                       text:
 *                         type: string
 *                         description: Текст вопроса
 *                       options:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             text:
 *                               type: string
 *                               description: Текст варианта ответа
 *                       hint:
 *                         type: string
 *                         nullable: true
 *                         description: Подсказка
 *                       imageUrl:
 *                         type: string
 *                         nullable: true
 *                         description: URL изображения
 *                       videoUrl:
 *                         type: string
 *                         nullable: true
 *                         description: URL видео
 *                       category:
 *                         type: string
 *                         description: Категория вопроса
 *                       questionNumber:
 *                         type: integer
 *                         description: Номер вопроса
 *                       userAnswer:
 *                         type: integer
 *                         nullable: true
 *                         description: Ответ пользователя
 *                       isCorrect:
 *                         type: boolean
 *                         nullable: true
 *                         description: Правильность ответа
 *                 mistakesDetails:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       questionId:
 *                         type: string
 *                         description: ID вопроса
 *                       questionText:
 *                         type: string
 *                         description: Текст вопроса
 *                       selectedOption:
 *                         type: string
 *                         description: Выбранный пользователем ответ
 *                       correctOption:
 *                         type: string
 *                         description: Правильный ответ
 *                       hint:
 *                         type: string
 *                         nullable: true
 *                         description: Подсказка
 *                       imageUrl:
 *                         type: string
 *                         nullable: true
 *                         description: URL изображения
 *                 totalTimeSpent:
 *                   type: integer
 *                   description: Общее время, затраченное на марафон (в секундах)
 *                 formattedTotalTimeSpent:
 *                   type: string
 *                   description: Форматированное общее время (например, "15 мин 30 сек")
 *       401:
 *         description: Не авторизован
 */
router.get('/marathon/all-statistics',
  isAuthenticated,
  examController.getAllMarathonStatistics
);
/**
 * @swagger
 * /api/exam/marathon/current-progress:
 *   get:
 *     summary: Получить прогресс текущего марафонского экзамена
 *     tags: [Exam]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Прогресс текущего марафона
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: ['not_started', 'in_progress', 'completed']
 *                   description: Статус марафона
 *                 totalQuestions:
 *                   type: integer
 *                   description: Общее количество вопросов (фиксировано 800)
 *                 answeredQuestions:
 *                   type: integer
 *                   description: Количество отвеченных вопросов
 *                 correctAnswers:
 *                   type: integer
 *                   description: Количество правильных ответов
 *                 mistakes:
 *                   type: integer
 *                   description: Количество ошибок
 *                 questions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       questionId:
 *                         type: string
 *                         description: ID вопроса
 *                       text:
 *                         type: string
 *                         description: Текст вопроса
 *                       options:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             text:
 *                               type: string
 *                               description: Текст варианта ответа
 *                       hint:
 *                         type: string
 *                         nullable: true
 *                         description: Подсказка
 *                       imageUrl:
 *                         type: string
 *                         nullable: true
 *                         description: URL изображения
 *                       videoUrl:
 *                         type: string
 *                         nullable: true
 *                         description: URL видео
 *                       category:
 *                         type: string
 *                         description: Категория вопроса
 *                       questionNumber:
 *                         type: integer
 *                         description: Номер вопроса
 *                       userAnswer:
 *                         type: integer
 *                         nullable: true
 *                         description: Ответ пользователя
 *                       isCorrect:
 *                         type: boolean
 *                         nullable: true
 *                         description: Правильность ответа
 *                 mistakesDetails:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       questionId:
 *                         type: string
 *                         description: ID вопроса
 *                       questionText:
 *                         type: string
 *                         description: Текст вопроса
 *                       selectedOption:
 *                         type: string
 *                         description: Выбранный пользователем ответ
 *                       correctOption:
 *                         type: string
 *                         description: Правильный ответ
 *                       hint:
 *                         type: string
 *                         nullable: true
 *                         description: Подсказка
 *                       imageUrl:
 *                         type: string
 *                         nullable: true
 *                         description: URL изображения
 *                 timeSpent:
 *                   type: integer
 *                   description: Время, затраченное на марафон (в секундах)
 *                 formattedTimeSpent:
 *                   type: string
 *                   description: Форматированное время (например, "15 мин 30 сек")
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Билеты не найдены
 */
router.get('/marathon/current-progress', isAuthenticated, examController.getCurrentMarathonAllProgress);

/**
 * @swagger
 * /api/exam/questions/random/answer:
 *   post:
 *     summary: Отправить ответ на случайный вопрос
 *     tags: [Exam]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - questionId
 *               - userAnswer
 *             properties:
 *               sessionId:
 *                 type: string
 *                 description: ID сессии случайных вопросов
 *               questionId:
 *                 type: string
 *                 description: ID вопроса
 *               userAnswer:
 *                 type: integer
 *                 description: Ответ пользователя (индекс варианта ответа)
 *     responses:
 *       200:
 *         description: Ответ обработан
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 questionId:
 *                   type: string
 *                   description: ID вопроса
 *                 isCorrect:
 *                   type: boolean
 *                   description: Правильность ответа
 *                 correctOption:
 *                   type: string
 *                   description: Текст правильного ответа
 *       400:
 *         description: Неверный запрос
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Сессия или вопрос не найдены
 */
router.post('/questions/random/answer', isAuthenticated, validateAnswer, examController.submitRandomQuestionAnswer);

/**
 * @swagger
 * /api/exam/marathon/answers:
 *   get:
 *     summary: Получить все вопросы и правильные ответы марафона
 *     tags: [Exam]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список всех вопросов марафона с правильными ответами
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   questionText:
 *                     type: string
 *                     description: Текст вопроса
 *                   questionId:
 *                     type: string
 *                     description: ID вопроса
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
 *                   correctAnswer:
 *                     type: string
 *                     nullable: true
 *                     description: Текст правильного ответа
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Ошибка сервера
 */
router.get('/marathon/answers', isAuthenticated, examController.marafon);

/**
 * @swagger
 * /api/exam/marathon/start:
 *   post:
 *     summary: Начать марафонский экзамен
 *     tags: [Exam]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID пользователя
 *     responses:
 *       201:
 *         description: Марафонский экзамен начат
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exam:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: ID марафонского экзамена
 *                     userId:
 *                       type: string
 *                       description: ID пользователя
 *                     questions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           questionId:
 *                             type: string
 *                             description: ID вопроса
 *                           userAnswer:
 *                             type: integer
 *                             nullable: true
 *                             description: Ответ пользователя
 *                           isCorrect:
 *                             type: boolean
 *                             nullable: true
 *                             description: Правильность ответа
 *                     mistakes:
 *                       type: integer
 *                       description: Количество ошибок
 *                     status:
 *                       type: string
 *                       enum: ['in_progress', 'completed']
 *                       description: Статус марафона
 *                     startTime:
 *                       type: string
 *                       format: date-time
 *                       description: Время начала марафона
 *                     completedQuestions:
 *                       type: integer
 *                       description: Количество отвеченных вопросов
 *                 questions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       questionId:
 *                         type: string
 *                         description: ID вопроса
 *                       questionText:
 *                         type: string
 *                         description: Текст вопроса
 *                       options:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             text:
 *                               type: string
 *                               description: Текст варианта ответа
 *                       category:
 *                         type: string
 *                         description: Категория вопроса
 *       400:
 *         description: Неверный запрос
 *       401:
 *         description: Не авторизован
 */
router.post('/marathon/start',
  isAuthenticated,
  examController.startMarathon
);

/**
 * @swagger
 * /api/exam/marathon/{examId}/unanswered:
 *   get:
 *     summary: Получить неотвеченные вопросы марафонского экзамена
 *     tags: [Exam]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID марафонского экзамена
 *     responses:
 *       200:
 *         description: Список неотвеченных вопросов
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   questionId:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: ID вопроса
 *                       text:
 *                         type: string
 *                         description: Текст вопроса
 *                       options:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             text:
 *                               type: string
 *                               description: Текст варианта ответа
 *                       hint:
 *                         type: string
 *                         nullable: true
 *                         description: Подсказка
 *                       imageUrl:
 *                         type: string
 *                         nullable: true
 *                         description: URL изображения
 *                       category:
 *                         type: string
 *                         description: Категория вопроса
 *                       questionNumber:
 *                         type: integer
 *                         description: Номер вопроса
 *                   userAnswer:
 *                     type: integer
 *                     nullable: true
 *                     description: Ответ пользователя (null для неотвеченных)
 *                   isCorrect:
 *                     type: boolean
 *                     nullable: true
 *                     description: Правильность ответа (null для неотвеченных)
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Экзамен не найден
 */
router.get('/marathon/:examId/unanswered', isAuthenticated, validateExamId, examController.getUnansweredQuestions);

/**
 * @swagger
 * /api/exam/marathon/{examId}/unanswered/answer:
 *   post:
 *     summary: Отправить ответ на неотвеченный вопрос марафона
 *     tags: [Exam]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID марафонского экзамена
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - questionIndex
 *               - userAnswer
 *             properties:
 *               questionIndex:
 *                 type: integer
 *                 description: Индекс вопроса в списке неотвеченных
 *               userAnswer:
 *                 type: integer
 *                 description: Ответ пользователя (индекс варианта ответа)
 *     responses:
 *       200:
 *         description: Ответ принят
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: ID марафонского экзамена
 *                 userId:
 *                   type: string
 *                   description: ID пользователя
 *                 questions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       questionId:
 *                         type: string
 *                         description: ID вопроса
 *                       userAnswer:
 *                         type: integer
 *                         nullable: true
 *                         description: Ответ пользователя
 *                       isCorrect:
 *                         type: boolean
 *                         nullable: true
 *                         description: Правильность ответа
 *                 mistakes:
 *                   type: integer
 *                   description: Количество ошибок
 *                 status:
 *                   type: string
 *                   enum: ['in_progress', 'completed']
 *                   description: Статус марафона
 *                 startTime:
 *                   type: string
 *                   format: date-time
 *                   description: Время начала марафона
 *                 completedQuestions:
 *                   type: integer
 *                   description: Количество отвеченных вопросов
 *       400:
 *         description: Неверный запрос
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Экзамен не найден
 */
router.post('/marathon/:examId/unanswered/answer', isAuthenticated, validateAnswer, examController.submitUnansweredQuestionAnswer);

/**
 * @swagger
 * /api/exam/marathon/{examId}/unanswered/results:
 *   get:
 *     summary: Получить результаты марафона по неотвеченным вопросам
 *     tags: [Exam]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID марафонского экзамена
 *     responses:
 *       200:
 *         description: Результаты марафона по неотвеченным вопросам
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exam:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: ID марафонского экзамена
 *                     userId:
 *                       type: string
 *                       description: ID пользователя
 *                     questions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           questionId:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 description: ID вопроса
 *                               text:
 *                                 type: string
 *                                 description: Текст вопроса
 *                               options:
 *                                 type: array
 *                                 items:
 *                                   type: object
 *                                   properties:
 *                                     text:
 *                                       type: string
 *                                       description: Текст варианта ответа
 *                               hint:
 *                                 type: string
 *                                 nullable: true
 *                                 description: Подсказка
 *                               imageUrl:
 *                                 type: string
 *                                 nullable: true
 *                                 description: URL изображения
 *                               category:
 *                                 type: string
 *                                 description: Категория вопроса
 *                               questionNumber:
 *                                 type: integer
 *                                 description: Номер вопроса
 *                           userAnswer:
 *                             type: integer
 *                             nullable: true
 *                             description: Ответ пользователя
 *                           isCorrect:
 *                             type: boolean
 *                             nullable: true
 *                             description: Правильность ответа
 *                     mistakes:
 *                       type: integer
 *                       description: Количество ошибок
 *                     status:
 *                       type: string
 *                       enum: ['in_progress', 'completed']
 *                       description: Статус марафона
 *                     startTime:
 *                       type: string
 *                       format: date-time
 *                       description: Время начала марафона
 *                     completedQuestions:
 *                       type: integer
 *                       description: Количество отвеченных вопросов
 *                     answeredQuestions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           questionId:
 *                             type: string
 *                             description: ID вопроса
 *                           selectedOption:
 *                             type: string
 *                             description: Выбранный пользователем ответ
 *                           isCorrect:
 *                             type: boolean
 *                             description: Правильность ответа
 *                           hint:
 *                             type: string
 *                             nullable: true
 *                             description: Подсказка
 *                           imageUrl:
 *                             type: string
 *                             nullable: true
 *                             description: URL изображения
 *                     mistakesDetails:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           questionId:
 *                             type: string
 *                             description: ID вопроса
 *                           questionText:
 *                             type: string
 *                             description: Текст вопроса
 *                           selectedOption:
 *                             type: string
 *                             description: Выбранный пользователем ответ
 *                           correctOption:
 *                             type: string
 *                             description: Правильный ответ
 *                           hint:
 *                             type: string
 *                             nullable: true
 *                             description: Подсказка
 *                           imageUrl:
 *                             type: string
 *                             nullable: true
 *                             description: URL изображения
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     totalQuestions:
 *                       type: integer
 *                       description: Общее количество вопросов
 *                     unansweredQuestions:
 *                       type: integer
 *                       description: Количество неотвеченных вопросов
 *                     correctAnswers:
 *                       type: integer
 *                       description: Количество правильных ответов
 *                     mistakes:
 *                       type: integer
 *                       description: Количество ошибок
 *                     timeSpent:
 *                       type: integer
 *                       description: Время, затраченное на марафон (в секундах)
 *                     status:
 *                       type: string
 *                       enum: ['in_progress', 'completed']
 *                       description: Статус марафона
 *                     completedAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       description: Время завершения марафона
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Экзамен не найден
 */
router.get('/marathon/:examId/unanswered/results', isAuthenticated, validateExamId, examController.getUnansweredResults);

/**
 * @swagger
 * /api/exam/marathon/{examId}/answer:
 *   post:
 *     summary: Отправить ответ на вопрос марафона
 *     tags: [Exam]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID марафонского экзамена
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - questionIndex
 *               - userAnswer
 *             properties:
 *               questionIndex:
 *                 type: integer
 *                 description: Индекс вопроса
 *               userAnswer:
 *                 type: integer
 *                 description: Ответ пользователя (индекс варианта ответа)
 *     responses:
 *       200:
 *         description: Ответ принят
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: ID марафонского экзамена
 *                 userId:
 *                   type: string
 *                   description: ID пользователя
 *                 questions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       questionId:
 *                         type: string
 *                         description: ID вопроса
 *                       userAnswer:
 *                         type: integer
 *                         nullable: true
 *                         description: Ответ пользователя
 *                       isCorrect:
 *                         type: boolean
 *                         nullable: true
 *                         description: Правильность ответа
 *                 mistakes:
 *                   type: integer
 *                   description: Количество ошибок
 *                 status:
 *                   type: string
 *                   enum: ['in_progress', 'completed']
 *                   description: Статус марафона
 *                 startTime:
 *                   type: string
 *                   format: date-time
 *                   description: Время начала марафона
 *                 completedQuestions:
 *                   type: integer
 *                   description: Количество отвеченных вопросов
 *       400:
 *         description: Неверный запрос
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Экзамен не найден
 */
router.post('/marathon/:examId/answer',
  isAuthenticated,
  validateAnswer,
  examController.submitMarathonAnswer
);

/**
 * @swagger
 * /api/exam/marathon/{examId}/results:
 *   get:
 *     summary: Получить результаты марафонского экзамена
 *     tags: [Exam]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID марафонского экзамена
 *     responses:
 *       200:
 *         description: Результаты марафонского экзамена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exam:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: ID марафонского экзамена
 *                     userId:
 *                       type: string
 *                       description: ID пользователя
 *                     questions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           questionId:
 *                             type: object
 *                             description: Данные вопроса
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 description: ID вопроса
 *                               text:
 *                                 type: string
 *                                 description: Текст вопроса
 *                               imageUrl:
 *                                 type: string
 *                                 nullable: true
 *                                 description: URL изображения
 *                               options:
 *                                 type: array
 *                                 items:
 *                                   type: object
 *                                   properties:
 *                                     text:
 *                                       type: string
 *                                       description: Текст варианта ответа
 *                               hint:
 *                                 type: string
 *                                 nullable: true
 *                                 description: Подсказка
 *                               videoUrl:
 *                                 type: string
 *                                 nullable: true
 *                                 description: URL видео
 *                               category:
 *                                 type: string
 *                                 description: Категория вопроса
 *                               questionNumber:
 *                                 type: integer
 *                                 description: Номер вопроса
 *                           userAnswer:
 *                             type: integer
 *                             nullable: true
 *                             description: Ответ пользователя
 *                           isCorrect:
 *                             type: boolean
 *                             nullable: true
 *                             description: Правильность ответа
 *                     mistakes:
 *                       type: integer
 *                       description: Количество ошибок
 *                     status:
 *                       type: string
 *                       enum: ['in_progress', 'completed']
 *                       description: Статус марафона
 *                     startTime:
 *                       type: string
 *                       format: date-time
 *                       description: Время начала марафона
 *                     completedQuestions:
 *                       type: integer
 *                       description: Количество отвеченных вопросов
 *                     completedAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       description: Время завершения марафона
 *                     answeredQuestions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           questionId:
 *                             type: string
 *                             description: ID вопроса
 *                           selectedOption:
 *                             type: string
 *                             description: Выбранный пользователем ответ
 *                           isCorrect:
 *                             type: boolean
 *                             description: Правильность ответа
 *                           hint:
 *                             type: string
 *                             nullable: true
 *                             description: Подсказка
 *                           imageUrl:
 *                             type: string
 *                             nullable: true
 *                             description: URL изображения
 *                           videoUrl:
 *                             type: string
 *                             nullable: true
 *                             description: URL видео
 *                     mistakesDetails:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           questionId:
 *                             type: string
 *                             description: ID вопроса
 *                           questionText:
 *                             type: string
 *                             description: Текст вопроса
 *                           selectedOption:
 *                             type: string
 *                             description: Выбранный пользователем ответ
 *                           correctOption:
 *                             type: string
 *                             description: Правильный ответ
 *                           hint:
 *                             type: string
 *                             nullable: true
 *                             description: Подсказка
 *                           imageUrl:
 *                             type: string
 *                             nullable: true
 *                             description: URL изображения
 *                           videoUrl:
 *                             type: string
 *                             nullable: true
 *                             description: URL видео
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     totalQuestions:
 *                       type: integer
 *                       description: Общее количество вопросов
 *                     correctAnswers:
 *                       type: integer
 *                       description: Количество правильных ответов
 *                     mistakes:
 *                       type: integer
 *                       description: Количество ошибок
 *                     timeSpent:
 *                       type: integer
 *                       description: Время, затраченное на марафон (в секундах)
 *                     status:
 *                       type: string
 *                       enum: ['in_progress', 'completed']
 *                       description: Статус марафона
 *                     completedAt:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       description: Время завершения марафона
 *       404:
 *         description: Экзамен не найден
 *       401:
 *         description: Не авторизован
 */
router.get('/marathon/:examId/results',
  isAuthenticated,
  validateExamId,
  examController.getMarathonResults
);


/**
 * @swagger
 * /api/exam/select-ticket:
 *   post:
 *     summary: Выбрать случайный билет и получить результат последнего экзамена
 *     tags: [Exam]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID пользователя
 *     responses:
 *       200:
 *         description: Номер случайного билета и результат последнего экзамена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ticketNumber:
 *                   type: integer
 *                   description: Номер выбранного билета
 *                 lastExamResult:
 *                   type: object
 *                   nullable: true
 *                   description: Результат последнего экзамена (null, если экзаменов не было)
 *                   properties:
 *                     examId:
 *                       type: string
 *                       description: ID экзамена
 *                     ticketNumber:
 *                       type: integer
 *                       description: Номер билета последнего экзамена
 *                     status:
 *                       type: string
 *                       enum: ['in_progress', 'passed', 'failed']
 *                       description: Статус экзамена
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         totalQuestions:
 *                           type: integer
 *                           description: Общее количество вопросов
 *                         correctAnswers:
 *                           type: integer
 *                           description: Количество правильных ответов
 *                         mistakes:
 *                           type: integer
 *                           description: Количество ошибок
 *                         timeSpent:
 *                           type: integer
 *                           description: Время, затраченное на экзамен (в миллисекундах)
 *       400:
 *         description: Неверный запрос
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Ошибка сервера
 */
router.post('/select-ticket',
  isAuthenticated,
  examController.selectTicket
);

/**
 * @swagger
 * /api/exam/start:
 *   post:
 *     summary: Начать экзамен с указанным билетом
 *     tags: [Exam]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - ticketNumber
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID пользователя
 *               ticketNumber:
 *                 type: integer
 *                 description: Номер выбранного билета
 *     responses:
 *       201:
 *         description: Экзамен начат
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: ID экзамена
 *                 userId:
 *                   type: string
 *                   description: ID пользователя
 *                 ticketNumber:
 *                   type: integer
 *                   description: Номер выбранного билета
 *                 questions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       questionId:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: ID вопроса
 *                           text:
 *                             type: string
 *                             description: Текст вопроса
 *                           options:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 text:
 *                                   type: string
 *                                   description: Текст варианта ответа
 *                           hint:
 *                             type: string
 *                             nullable: true
 *                             description: Подсказка
 *                           imageUrl:
 *                             type: string
 *                             nullable: true
 *                             description: URL изображения
 *                           category:
 *                             type: string
 *                             description: Категория вопроса
 *                           questionNumber:
 *                             type: integer
 *                             description: Номер вопроса в билете
 *                       userAnswer:
 *                         type: integer
 *                         nullable: true
 *                         description: Ответ пользователя (индекс варианта, null если не отвечено)
 *                       isCorrect:
 *                         type: boolean
 *                         nullable: true
 *                         description: Правильность ответа (null если не отвечено)
 *                 extraQuestions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       questionId:
 *                         type: string
 *                         description: ID дополнительного вопроса
 *                       userAnswer:
 *                         type: integer
 *                         nullable: true
 *                         description: Ответ пользователя (null если не отвечено)
 *                       isCorrect:
 *                         type: boolean
 *                         nullable: true
 *                         description: Правильность ответа (null если не отвечено)
 *                 mistakes:
 *                   type: integer
 *                   description: Количество ошибок
 *                 status:
 *                   type: string
 *                   enum: ['in_progress', 'passed', 'failed']
 *                   description: Статус экзамена
 *                 startTime:
 *                   type: string
 *                   format: date-time
 *                   description: Время начала экзамена
 *                 timeLimit:
 *                   type: integer
 *                   description: Ограничение времени (в миллисекундах)
 *                 extraTime:
 *                   type: integer
 *                   description: Дополнительное время (в миллисекундах)
 *                 mistakesDetails:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       questionId:
 *                         type: string
 *                         description: ID вопроса
 *                       questionText:
 *                         type: string
 *                         description: Текст вопроса
 *                       selectedOption:
 *                         type: string
 *                         description: Выбранный пользователем ответ
 *                       correctOption:
 *                         type: string
 *                         description: Правильный ответ
 *                       hint:
 *                         type: string
 *                         nullable: true
 *                         description: Подсказка
 *                       imageUrl:
 *                         type: string
 *                         nullable: true
 *                         description: URL изображения
 *       401:
 *         description: Не авторизован
 *       400:
 *         description: Неверный запрос
 */
router.post('/start',
  isAuthenticated,
  validateExamStart,
  examController.startExam
);

/**
 * @swagger
 * /api/exam/{examId}/answer:
 *   post:
 *     summary: Отправить ответ на вопрос
 *     tags: [Exam]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID экзамена
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - questionIndex
 *               - userAnswer
 *             properties:
 *               questionIndex:
 *                 type: integer
 *                 description: Индекс вопроса
 *               userAnswer:
 *                 type: integer
 *                 description: Ответ пользователя (индекс варианта ответа)
 *     responses:
 *       200:
 *         description: Ответ принят. При каждой ошибке добавляется 5 случайных дополнительных вопросов. Максимум 3 ошибки, после чего экзамен завершается со статусом 'failed'.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: ID экзамена
 *                 userId:
 *                   type: string
 *                   description: ID пользователя
 *                 ticketNumber:
 *                   type: integer
 *                   description: Номер выбранного билета
 *                 questions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       questionId:
 *                         type: string
 *                         description: ID вопроса из билета
 *                       userAnswer:
 *                         type: integer
 *                         nullable: true
 *                         description: Ответ пользователя (null, если не отвечено)
 *                       isCorrect:
 *                         type: boolean
 *                         nullable: true
 *                         description: Правильность ответа (null, если не отвечено)
 *                 extraQuestions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       questionId:
 *                         type: string
 *                         description: ID дополнительного вопроса
 *                       userAnswer:
 *                         type: integer
 *                         nullable: true
 *                         description: Ответ пользователя (null, если не отвечено)
 *                       isCorrect:
 *                         type: boolean
 *                         nullable: true
 *                         description: Правильность ответа (null, если не отвечено)
 *                 mistakes:
 *                   type: integer
 *                   description: Количество ошибок
 *                 status:
 *                   type: string
 *                   enum: ['in_progress', 'passed', 'failed']
 *                   description: Статус экзамена
 *                 startTime:
 *                   type: string
 *                   format: date-time
 *                   description: Время начала экзамена
 *                 timeLimit:
 *                   type: integer
 *                   description: Ограничение времени (в миллисекундах)
 *                 extraTime:
 *                   type: integer
 *                   description: Дополнительное время (в миллисекундах)
 *       400:
 *         description: Неверный запрос
 *       401:
 *         description: Не авторизован
 *       404:
 *         description: Экзамен не найден
 */
router.post('/:examId/answer',
  isAuthenticated,
  validateAnswer,
  examController.submitAnswer
);

/**
 * @swagger
 * /api/exam/{examId}:
 *   get:
 *     summary: Получить статус экзамена
 *     tags: [Exam]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID экзамена
 *     responses:
 *       200:
 *         description: Статус экзамена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exam:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: ID экзамена
 *                     userId:
 *                       type: string
 *                       description: ID пользователя
 *                     ticketNumber:
 *                       type: integer
 *                       description: Номер выбранного билета
 *                     questions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           questionId:
 *                             type: object
 *                             description: Данные вопроса из билета
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 description: ID вопроса
 *                               text:
 *                                 type: string
 *                                 description: Текст вопроса
 *                               imageUrl:
 *                                 type: string
 *                                 description: URL изображения (если есть)
 *                               options:
 *                                 type: array
 *                                 items:
 *                                   type: object
 *                                   properties:
 *                                     text:
 *                                       type: string
 *                                       description: Текст варианта ответа
 *                                     isCorrect:
 *                                       type: boolean
 *                                       description: Является ли вариант правильным
 *                               hint:
 *                                 type: string
 *                                 description: Подсказка (если есть)
 *                               videoUrl:
 *                                 type: string
 *                                 description: URL видео (если есть)
 *                               category:
 *                                 type: string
 *                                 description: Категория вопроса
 *                               questionNumber:
 *                                 type: integer
 *                                 description: Номер вопроса в билете
 *                           userAnswer:
 *                             type: integer
 *                             nullable: true
 *                             description: Ответ пользователя (null, если не отвечено)
 *                           isCorrect:
 *                             type: boolean
 *                             nullable: true
 *                             description: Правильность ответа (null, если не отвечено)
 *                     extraQuestions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           questionId:
 *                             type: object
 *                             description: Данные дополнительного вопроса
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 description: ID вопроса
 *                               text:
 *                                 type: string
 *                                 description: Текст вопроса
 *                               imageUrl:
 *                                 type: string
 *                                 description: URL изображения (если есть)
 *                               options:
 *                                 type: array
 *                                 items:
 *                                   type: object
 *                                   properties:
 *                                     text:
 *                                       type: string
 *                                       description: Текст варианта ответа
 *                                     isCorrect:
 *                                       type: boolean
 *                                       description: Является ли вариант правильным
 *                               hint:
 *                                 type: string
 *                                 description: Подсказка (если есть)
 *                               videoUrl:
 *                                 type: string
 *                                 description: URL видео (если есть)
 *                               category:
 *                                 type: string
 *                                 description: Категория вопроса
 *                           userAnswer:
 *                             type: integer
 *                             nullable: true
 *                             description: Ответ пользователя (null, если не отвечено)
 *                           isCorrect:
 *                             type: boolean
 *                             nullable: true
 *                             description: Правильность ответа (null, если не отвечено)
 *                     mistakes:
 *                       type: integer
 *                       description: Количество ошибок
 *                     status:
 *                       type: string
 *                       enum: ['in_progress', 'passed', 'failed']
 *                       description: Статус экзамена
 *                     startTime:
 *                       type: string
 *                       format: date-time
 *                       description: Время начала экзамена
 *                     timeLimit:
 *                       type: integer
 *                       description: Ограничение времени (в миллисекундах)
 *                     extraTime:
 *                       type: integer
 *                       description: Дополнительное время (в миллисекундах)
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     totalQuestions:
 *                       type: integer
 *                       description: Общее количество вопросов
 *                     correctAnswers:
 *                       type: integer
 *                       description: Количество правильных ответов
 *                     mistakes:
 *                       type: integer
 *                       description: Количество ошибок
 *                     timeSpent:
 *                       type: integer
 *                       description: Время, затраченное на экзамен (в миллисекундах)
 *                     status:
 *                       type: string
 *                       enum: ['in_progress', 'passed', 'failed']
 *                       description: Статус экзамена
 *       404:
 *         description: Экзамен не найден
 *       401:
 *         description: Не авторизован
 */
router.get('/:examId',
  isAuthenticated,
  validateExamId,
  examController.getExamStatus
);

/**
 * @swagger
 * /api/exam/{examId}/share:
 *   get:
 *     summary: Получить шаблон для публикации результатов
 *     tags: [Exam]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID экзамена
 *     responses:
 *       200:
 *         description: Шаблон для публикации
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       description: Тип шаблона
 *                       example: "image"
 *                     template:
 *                       type: string
 *                       description: Название шаблона
 *                       example: "premium_result_template.jpg"
 *                     data:
 *                       type: object
 *                       properties:
 *                         score:
 *                           type: integer
 *                           description: Количество правильных ответов
 *                         total:
 *                           type: integer
 *                           description: Общее количество вопросов
 *                         mistakes:
 *                           type: integer
 *                           description: Количество ошибок
 *                         time:
 *                           type: integer
 *                           description: Время, затраченное на экзамен (в минутах)
 *                     shareOptions:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Варианты публикации
 *                       example: ["story", "post"]
 *                   description: Шаблон для премиум-пользователей
 *                 - type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       description: Тип шаблона
 *                       example: "text"
 *                     template:
 *                       type: string
 *                       description: Текст шаблона
 *                       example: "Вы набрали 18 из 20 баллов!"
 *                     referralLink:
 *                       type: string
 *                       description: Реферальная ссылка
 *                       example: "https://app.link/referral"
 *                   description: Шаблон для обычных пользователей
 *       404:
 *         description: Экзамен не найден
 *       401:
 *         description: Не авторизован
 */
router.get('/:examId/share',
  isAuthenticated,
  validateExamId,
  examController.getShareTemplate
);

/**
 * @swagger
 * /api/exam/{examId}/results:
 *   get:
 *     summary: Получить результаты экзамена
 *     tags: [Exam]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID экзамена
 *     responses:
 *       200:
 *         description: Результаты экзамена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exam:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: ID экзамена
 *                     userId:
 *                       type: string
 *                       description: ID пользователя
 *                     ticketNumber:
 *                       type: integer
 *                       description: Номер выбранного билета
 *                     questions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           questionId:
 *                             type: object
 *                             description: Данные вопроса из билета
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 description: ID вопроса
 *                               text:
 *                                 type: string
 *                                 description: Текст вопроса
 *                               imageUrl:
 *                                 type: string
 *                                 description: URL изображения (если есть)
 *                               options:
 *                                 type: array
 *                                 items:
 *                                   type: object
 *                                   properties:
 *                                     text:
 *                                       type: string
 *                                       description: Текст варианта ответа
 *                                     isCorrect:
 *                                       type: boolean
 *                                       description: Является ли вариант правильным
 *                               hint:
 *                                 type: string
 *                                 description: Подсказка (если есть)
 *                               videoUrl:
 *                                 type: string
 *                                 description: URL видео (если есть)
 *                               category:
 *                                 type: string
 *                                 description: Категория вопроса
 *                               questionNumber:
 *                                 type: integer
 *                                 description: Номер вопроса в билете
 *                           userAnswer:
 *                             type: integer
 *                             nullable: true
 *                             description: Ответ пользователя (null, если не отвечено)
 *                           isCorrect:
 *                             type: boolean
 *                             nullable: true
 *                             description: Правильность ответа (null, если не отвечено)
 *                     extraQuestions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           questionId:
 *                             type: object
 *                             description: Данные дополнительного вопроса
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 description: ID вопроса
 *                               text:
 *                                 type: string
 *                                 description: Текст вопроса
 *                               imageUrl:
 *                                 type: string
 *                                 description: URL изображения (если есть)
 *                               options:
 *                                 type: array
 *                                 items:
 *                                   type: object
 *                                   properties:
 *                                     text:
 *                                       type: string
 *                                       description: Текст варианта ответа
 *                                     isCorrect:
 *                                       type: boolean
 *                                       description: Является ли вариант правильным
 *                               hint:
 *                                 type: string
 *                                 description: Подсказка (если есть)
 *                               videoUrl:
 *                                 type: string
 *                                 description: URL видео (если есть)
 *                               category:
 *                                 type: string
 *                                 description: Категория вопроса
 *                           userAnswer:
 *                             type: integer
 *                             nullable: true
 *                             description: Ответ пользователя (null, если не отвечено)
 *                           isCorrect:
 *                             type: boolean
 *                             nullable: true
 *                             description: Правильность ответа (null, если не отвечено)
 *                     mistakes:
 *                       type: integer
 *                       description: Количество ошибок
 *                     status:
 *                       type: string
 *                       enum: ['in_progress', 'passed', 'failed']
 *                       description: Статус экзамена
 *                     startTime:
 *                       type: string
 *                       format: date-time
 *                       description: Время начала экзамена
 *                     timeLimit:
 *                       type: integer
 *                       description: Ограничение времени (в миллисекундах)
 *                     extraTime:
 *                       type: integer
 *                       description: Дополнительное время (в миллисекундах)
 *                     mistakesDetails:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           questionId:
 *                             type: string
 *                             description: ID вопроса
 *                           questionText:
 *                             type: string
 *                             description: Текст вопроса
 *                           selectedOption:
 *                             type: string
 *                             description: Выбранный пользователем ответ
 *                           correctOption:
 *                             type: string
 *                             description: Правильный ответ
 *                       description: Подробности о допущенных ошибках
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     totalQuestions:
 *                       type: integer
 *                       description: Общее количество вопросов
 *                     correctAnswers:
 *                       type: integer
 *                       description: Количество правильных ответов
 *                     mistakes:
 *                       type: integer
 *                       description: Количество ошибок
 *                     timeSpent:
 *                       type: integer
 *                       description: Время, затраченное на экзамен (в миллисекундах)
 *                     status:
 *                       type: string
 *                       enum: ['in_progress', 'passed', 'failed']
 *                       description: Статус экзамена
 *       404:
 *         description: Результаты не найдены
 *       401:
 *         description: Не авторизован
 */
router.get('/:examId/results',
  isAuthenticated,
  examController.getResults
);

/**
 * @swagger
 * /api/exam/questions:
 *   get:
 *     summary: Получить все вопросы по выбранной категории
 *     tags: [Exam]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         description: Категория вопросов
 *     responses:
 *       200:
 *         description: Список всех вопросов по категории
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Ошибка сервера
 */
router.get('/questions', isAuthenticated, examController.getAllQuestionsByCategory);

/**
 * @swagger
 * /api/exam/questions/random:
 *   get:
 *     summary: Получить 5 случайных вопросов по выбранной категории
 *     tags: [Exam]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *         description: Категория вопросов
 *     responses:
 *       200:
 *         description: Список из 5 случайных вопросов по категории
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Ошибка сервера
 */
router.get('/questions/random', isAuthenticated, examController.getRandomQuestions);

/**
 * @swagger
 * /api/exam/questions/new:
 *   get:
 *     summary: Получить новые вопросы, которые пользователь не проходил
 *     tags: [Exam]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список новых вопросов
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   questionId:
 *                     type: string
 *                     description: ID вопроса
 *                   questionText:
 *                     type: string
 *                     description: Текст вопроса
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
 *                   category:
 *                     type: string
 *                     description: Категория вопроса
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Ошибка сервера
 */
router.get('/questions/new', isAuthenticated, examController.getNewQuestions);

module.exports = router;