const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { validateExamStart, validateAnswer, validateExamId } = require('../middleware/examValidation');
const { isAuthenticated } = require('../middleware/auth');

/**
 * @swagger
 * /api/exam/start:
 *   post:
 *     summary: Начать экзамен
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
 *               - ticketId
 *             properties:
 *               userId:
 *                 type: string
 *              
 *     responses:
 *       201:
 *         description: Экзамен начат
 *       401:
 *         description: Не авторизован
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
 *               userAnswer:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Ответ принят
 *       400:
 *         description: Неверный запрос
 *       401:
 *         description: Не авторизован
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
 *     responses:
 *       200:
 *         description: Статус экзамена
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
 *     responses:
 *       200:
 *         description: Шаблон для публикации
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
 * /api/exam/ticket:
 *   post:
 *     summary: Выбрать билет для экзамена
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
 *               - ticketId
 *             properties:
 *               ticketId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Билет выбран
 *       401:
 *         description: Не авторизован
 */
router.post('/ticket',
  isAuthenticated,
  examController.selectTicket
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
 *     responses:
 *       200:
 *         description: Результаты экзамена
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