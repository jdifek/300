const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuthenticated } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/users/telegram-login:
 *   post:
 *     summary: Вход или регистрация пользователя через Telegram
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               telegramId: { type: string, description: "ID пользователя в Telegram" }
 *               username: { type: string, description: "Имя пользователя" }
 *               avatar: { type: string, description: "URL аватара (опционально)" }
 *     responses:
 *       200: { description: "Успешный вход или регистрация" }
 *       400: { description: "Отсутствуют обязательные поля" }
 *       500: { description: "Ошибка сервера" }
 */
router.post('/telegram-login', userController.telegramLogin);

/**
 * @swagger
 * /api/users/refresh:
 *   post:
 *     summary: Обновление access-токена
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken: { type: string, description: "Refresh-токен" }
 *     responses:
 *       200: { description: "Новые токены сгенерированы" }
 *       401: { description: "Недействительный refresh-токен" }
 */
router.post('/refresh', userController.refreshToken);

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Получение профиля пользователя
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: "Профиль пользователя" }
 *       401: { description: "Неавторизован" }
 *       404: { description: "Пользователь не найден" }
 *       500: { description: "Ошибка сервера" }
 */
router.get('/profile', isAuthenticated, userController.getProfile);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Обновление профиля пользователя
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username: { type: string, description: "Новое имя пользователя" }
 *               avatar: { type: string, description: "Новый URL аватара" }
 *     responses:
 *       200: { description: "Обновленный профиль" }
 *       401: { description: "Неавторизован" }
 *       404: { description: "Пользователь не найден" }
 *       500: { description: "Ошибка сервера" }
 */
router.put('/profile', isAuthenticated, userController.updateProfile);

/**
 * @swagger
 * /api/users/subscription:
 *   put:
 *     summary: Обновление подписки пользователя
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type: { type: string, enum: ["free", "premium"], description: "Тип подписки" }
 *               autoRenew: { type: boolean, description: "Автопродление подписки" }
 *     responses:
 *       200: { description: "Обновленная подписка" }
 *       401: { description: "Неавторизован" }
 *       404: { description: "Пользователь не найден" }
 *       500: { description: "Ошибка сервера" }
 */
router.put('/subscription', isAuthenticated, userController.updateSubscription);

/**
 * @swagger
 * /api/users/progress:
 *   get:
 *     summary: Получение прогресса пользователя
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: "Прогресс пользователя" }
 *       401: { description: "Неавторизован" }
 *       404: { description: "Пользователь не найден" }
 *       500: { description: "Ошибка сервера" }
 */
router.get('/progress', isAuthenticated, userController.getProgress);

module.exports = router;