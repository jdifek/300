const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { validateExamStart, validateAnswer, validateExamId } = require('../middleware/examValidation');
const { isAuthenticated } = require('../middleware/auth');

/**
 * @swagger
 * /api/exam/marafon:
 *   get:
 *     summary: Получить все вопросы и ответы всех билетов
 *     tags: [Exam]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список всех вопросов с вариантами ответов и правильными ответами
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
 *                   correctAnswer:
 *                     type: string
 *                     description: Правильный ответ
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Ошибка сервера
 */
router.post('/marafon', 
  isAuthenticated,
  examController.marafon
)

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
 *         description: Ответ принят
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

module.exports = router;