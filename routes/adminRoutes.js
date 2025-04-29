// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuthenticated } = require('../middleware/auth');
const { isAdmin } = require('../middleware/role');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalName));
  },
});
const upload = multer({ storage });

/**
 * @swagger
 * /api/admin/broadcast:
 *   post:
 *     summary: Отправка массового сообщения
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               text: { type: string, description: "Текст сообщения" }
 *               image: { type: string, format: binary, description: "Изображение для рассылки" }
 *     responses:
 *       200:
 *         description: Сообщение отправлено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 broadcastId: { type: string }
 *       401: { description: Не авторизован }
 *       403: { description: Требуются права администратора }
 *       500: { description: Ошибка сервера }
 */
router.post('/broadcast', isAuthenticated, isAdmin, upload.single('image'), adminController.sendBroadcast);
/**
 * @swagger
 * /api/admin/subscription-plans:
 *   post:
 *     summary: Создание или обновление тарифа
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               price: { type: number }
 *               duration: { type: number }
 *               description: { type: string }
 *     responses:
 *       200: { description: Тариф обновлён }
 *       401: { description: Не авторизован }
 *       403: { description: Требуются права администратора }
 *       500: { description: Ошибка сервера }
 */
router.post('/subscription-plans', isAuthenticated, isAdmin, adminController.updateSubscriptionPlan);
/**
 * @swagger
 * /api/admin/gift-subscription:
 *   post:
 *     summary: Подарок подписки пользователю
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId: { type: string, description: "ID пользователя" }
 *               planName: { type: string, description: "Название тарифа" }
 *     responses:
 *       200: { description: Подписка подарена }
 *       400: { description: Неверные данные }
 *       401: { description: Не авторизован }
 *       403: { description: Требуются права администратора }
 *       500: { description: Ошибка сервера }
 */
router.post('/gift-subscription', isAuthenticated, isAdmin, adminController.giftSubscription);
/**
 * @swagger
 * /api/admin/analytics/links:
 *   get:
 *     summary: Статистика по переходам по ссылкам
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: link
 *         schema: { type: string }
 *         description: URL ссылки для фильтрации
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Статистика по переходам
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalClicks: { type: number }
 *                 clicksByLink: { type: array, items: { type: object, properties: { link: { type: string }, count: { type: number } } } }
 *       401: { description: Не авторизован }
 *       403: { description: Требуются права администратора }
 *       500: { description: Ошибка сервера }
 */
router.get('/analytics/links', isAuthenticated, isAdmin, adminController.getLinkAnalytics);

/**
 * @swagger
 * /api/admin/analytics/users:
 *   get:
 *     summary: Статистика по пользователям
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Статистика по пользователям
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers: { type: number }
 *                 activeUsers: { type: number }
 *                 blockedUsers: { type: number }
 *                 dailyActiveUsers: { type: number }
 *                 triDailyActiveUsers: { type: number }
 *                 totalSubscriptions: { type: number }
 *                 activeSubscriptions: { type: number }
 *                 multiRenewalUsers: { type: number }
 *       401: { description: Не авторизован }
 *       403: { description: Требуются права администратора }
 *       500: { description: Ошибка сервера }
 */
router.get('/analytics/users', isAuthenticated, isAdmin, adminController.getUserAnalytics);
/**
 * @swagger
 * /api/admin/subscription-plans:
 *   get:
 *     summary: Получение списка тарифов
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список тарифов
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name: { type: string }
 *                   price: { type: number }
 *                   duration: { type: number }
 *                   description: { type: string }
 *       401: { description: Не авторизован }
 *       403: { description: Требуются права администратора }
 *       500: { description: Ошибка сервера }
 */
router.get('/subscription-plans', isAuthenticated, isAdmin, adminController.getSubscriptionPlans);
module.exports = router;