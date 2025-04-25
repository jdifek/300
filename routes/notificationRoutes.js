const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: API для управления уведомлениями
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       required:
 *         - title
 *         - description
 *       properties:
 *         _id:
 *           type: string
 *           description: Автоматически сгенерированный ID уведомления
 *           example: 507f1f77bcf86cd799439011
 *         title:
 *           type: string
 *           description: Заголовок уведомления
 *           example: Новое уведомление
 *         description:
 *           type: string
 *           description: Описание уведомления
 *           example: Это важное уведомление для пользователей
 *       example:
 *         _id: 507f1f77bcf86cd799439011
 *         title: Новое уведомление
 *         description: Это важное уведомление для пользователей
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Получить список всех уведомлений
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список уведомлений успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 *       401:
 *         description: Пользователь не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
router.get('/', isAuthenticated, notificationController.getNotification);

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: Создать новое уведомление
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *                 description: Заголовок уведомления
 *                 example: Новое уведомление
 *               description:
 *                 type: string
 *                 description: Описание уведомления
 *                 example: Это важное уведомление для пользователей
 *     responses:
 *       200:
 *         description: Уведомление успешно создано
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notification'
 *       400:
 *         description: Неверный формат данных
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Title and description are required
 *       401:
 *         description: Пользователь не авторизован
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       500:
 *         description: Внутренняя ошибка сервера
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
router.post('/', isAuthenticated, notificationController.createNotification);

module.exports = router;