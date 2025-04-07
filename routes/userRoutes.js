// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuthenticated } = require('../middleware/auth');

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Авторизация через Telegram
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               telegramId: { type: string }
 *               username: { type: string }
 *               avatar: { type: string }
 *     responses:
 *       200: { description: "Токены доступа и обновления" }
 *       400: { description: "Недостаточно данных" }
 *       500: { description: "Ошибка сервера" }
 */
router.post('/login', userController.telegramLogin);

/**
 * @swagger
 * /api/users/refresh:
 *   post:
 *     summary: Обновление токена доступа
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200: { description: "Новые токены" }
 *       401: { description: "Недействительный токен обновления" }
 */
router.post('/refresh', userController.refreshToken);

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Получение профиля пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "Данные профиля пользователя"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username: { type: string }
 *                 telegramId: { type: string }
 *                 avatar: { type: string }
 *                 subscription: 
 *                   type: object
 *                   properties:
 *                     type: { type: string, enum: ['free', 'premium'] }
 *                     expiresAt: { type: string, format: date-time }
 *                     autoRenew: { type: boolean }
 *                 progress:
 *                   type: object
 *                   properties:
 *                     percentage: { type: number }
 *                     ticketsCompleted: { type: number }
 *                     lessonsCompleted: { type: number }
 *                     totalTimeSpent: { type: number }
 *                 firstLogin: { type: string, format: date-time }
 *                 subscribedToChannel: { type: boolean }
 *                 createdAt: { type: string, format: date-time }
 *       404: { description: "Пользователь не найден" }
 *       500: { description: "Ошибка сервера" }
 */
router.get('/profile', isAuthenticated, userController.getProfile);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Обновление профиля пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username: { type: string }
 *               avatar: { type: string }
 *     responses:
 *       200:
 *         description: "Обновленные данные профиля"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username: { type: string }
 *                 telegramId: { type: string }
 *                 avatar: { type: string }
 *                 subscription: 
 *                   type: object
 *                   properties:
 *                     type: { type: string, enum: ['free', 'premium'] }
 *                     expiresAt: { type: string, format: date-time }
 *                     autoRenew: { type: boolean }
 *                 progress:
 *                   type: object
 *                   properties:
 *                     percentage: { type: number }
 *                     ticketsCompleted: { type: number }
 *                     lessonsCompleted: { type: number }
 *                     totalTimeSpent: { type: number }
 *                 firstLogin: { type: string, format: date-time }
 *                 subscribedToChannel: { type: boolean }
 *                 createdAt: { type: string, format: date-time }
 *       404: { description: "Пользователь не найден" }
 *       500: { description: "Ошибка сервера" }
 */
router.put('/profile', isAuthenticated, userController.updateProfile);

/**
 * @swagger
 * /api/users/subscription:
 *   put:
 *     summary: Обновление подписки пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type: { type: string, enum: ['free', 'premium'] }
 *               autoRenew: { type: boolean }
 *     responses:
 *       200: { description: "Обновленные данные пользователя" }
 *       404: { description: "Пользователь не найден" }
 *       500: { description: "Ошибка сервера" }
 */
router.put('/subscription', isAuthenticated, userController.updateSubscription);

/**
 * @swagger
 * /api/users/progress:
 *   get:
 *     summary: Получение прогресса пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "Прогресс пользователя"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 percentage: { type: number }
 *                 ticketsCompleted: { type: number }
 *                 lessonsCompleted: { type: number }
 *                 totalTimeSpent: { type: number }
 *       404: { description: "Пользователь не найден" }
 *       500: { description: "Ошибка сервера" }
 */
router.get('/progress', isAuthenticated, userController.getProgress);

module.exports = router;