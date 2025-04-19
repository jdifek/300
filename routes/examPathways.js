const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth.js');
const pathwayController = require('../controllers/pathwayController.js');

/**
 * @swagger
 * /api/pathway:
 *   get:
 *     summary: Получение списка всех путей обучения
 *     tags: [Pathways]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список путей обучения
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: ID пути обучения
 *                   videoUrl:
 *                     type: string
 *                     description: URL видео для пути обучения
 *                   town:
 *                     type: string
 *                     description: Название города
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     description: Дата создания пути
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                     description: Дата последнего обновления пути
 *                 example:
 *                   _id: "507f1f77bcf86cd799439011"
 *                   videoUrl: "https://example.com/video.mp4"
 *                   town: "Москва"
 *                   createdAt: "2023-10-10T10:00:00.000Z"
 *                   updatedAt: "2023-10-10T10:00:00.000Z"
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Ошибка сервера
 */
router.get('/', isAuthenticated, pathwayController.get);

module.exports = router;