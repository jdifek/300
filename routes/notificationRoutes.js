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
 *           description: Заголовок уведомления (обязательное поле)
 *           example: Новое уведомление
 *         description:
 *           type: string
 *           description: Описание уведомления (обязательное поле)
 *           example: Это важное уведомление для пользователей
 *         videoUrl:
 *           type: string
 *           description: URL видео, связанного с уведомлением (необязательное поле)
 *           example: https://example.com/video.mp4
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Дата и время создания уведомления (автоматически добавляется)
 *           example: 2025-05-07T10:00:00.000Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Дата и время последнего обновления уведомления (автоматически добавляется)
 *           example: 2025-05-07T10:00:00.000Z
 *       example:
 *         _id: 507f1f77bcf86cd799439011
 *         title: Новое уведомление
 *         description: Это важное уведомление для пользователей
 *         videoUrl: https://example.com/video.mp4
 *         createdAt: 2025-05-07T10:00:00.000Z
 *         updatedAt: 2025-05-07T10:00:00.000Z
 * 
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
 *     description: Возвращает массив всех уведомлений, доступных в системе. Требуется авторизация.
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
 *             example:
 *               - _id: 507f1f77bcf86cd799439011
 *                 title: Новое уведомление
 *                 description: Это важное уведомление для пользователей
 *                 videoUrl: https://example.com/video.mp4
 *                 createdAt: 2025-05-07T10:00:00.000Z
 *                 updatedAt: 2025-05-07T10:00:00.000Z
 *               - _id: 507f1f77bcf86cd799439012
 *                 title: Обновление системы
 *                 description: Система обновлена до версии 2.0
 *                 createdAt: 2025-05-07T09:00:00.000Z
 *                 updatedAt: 2025-05-07T09:00:00.000Z
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
 *         description: Внутренняя ошибка сервера при получении уведомлений
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: Создать новое уведомление
 *     description: Создаёт новое уведомление с указанным заголовком, описанием и опциональным URL видео. Требуется авторизация.
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
 *                 description: Заголовок уведомления (обязательное поле)
 *                 example: Новое уведомление
 *               description:
 *                 type: string
 *                 description: Описание уведомления (обязательное поле)
 *                 example: Это важное уведомление для пользователей
 *               videoUrl:
 *                 type: string
 *                 description: URL видео, связанного с уведомлением (необязательное поле)
 *                 example: https://example.com/video.mp4
 *           example:
 *             title: Новое уведомление
 *             description: Это важное уведомление для пользователей
 *             videoUrl: https://example.com/video.mp4
 *     responses:
 *       200:
 *         description: Уведомление успешно создано
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notification'
 *             example:
 *               _id: 507f1f77bcf86cd799439011
 *               title: Новое уведомление
 *               description: Это важное уведомление для пользователей
 *               videoUrl: https://example.com/video.mp4
 *               createdAt: 2025-05-07T10:00:00.000Z
 *               updatedAt: 2025-05-07T10:00:00.000Z
 *       400:
 *         description: Неверный формат данных (например, отсутствуют обязательные поля)
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
 *         description: Внутренняя ошибка сервера при создании уведомления
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

router.get('/', isAuthenticated, notificationController.getNotification);

module.exports = router;