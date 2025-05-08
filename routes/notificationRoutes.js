// routes/notifications.js
const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middleware/auth');
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
 *         readBy:
 *           type: array
 *           items:
 *             type: string
 *           description: Список ID пользователей, пометивших уведомление как прочитанное
 *           example: ["507f1f77bcf86cd799439012"]
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Дата и время создания уведомления
 *           example: 2025-05-07T10:00:00.000Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Дата и время последнего обновления уведомления
 *           example: 2025-05-07T10:00:00.000Z
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
 *     summary: Получить список непрочитанных уведомлений
 *     description: Возвращает массив уведомлений, которые текущий пользователь еще не пометил как прочитанные. Требуется авторизация.
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

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: Создать новое уведомление
 *     description: Создаёт новое уведомление с указанным заголовком, описанием и опциональным URL видео. Требуется авторизация и роль администратора.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth:
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
 *     responses:
 *       201:
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
 *       403:
 *         description: Требуется роль администратора
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Доступ запрещен: требуется роль администратора
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

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   post:
 *     summary: Пометить уведомление как прочитанное
 *     description: Помечает уведомление как прочитанное для текущего пользователя. Требуется авторизация.
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID уведомления
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Уведомление отмечено как прочитанное
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Уведомление отмечено как прочитанное
 *       400:
 *         description: Неверный формат ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Неверный формат ID
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
 *       404:
 *         description: Уведомление не найдено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Уведомление не найдено
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
router.post('/', isAuthenticated, notificationController.createNotification);
router.post('/:id/read', isAuthenticated, notificationController.markAsRead);

module.exports = router;