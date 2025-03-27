// routes/courseRoutes.js
const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { isAuthenticated } = require('../middleware/auth');

/**
 * @swagger
 * /api/courses:
 *   get:
 *     summary: Получение списка всех курсов с прогрессом пользователя
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: "Список курсов с прогрессом" }
 *       500: { description: "Ошибка сервера" }
 */
router.get('/', isAuthenticated, courseController.getCourses);

/**
 * @swagger
 * /api/courses/{courseId}:
 *   get:
 *     summary: Получение курса с прогрессом пользователя
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID курса
 *     responses:
 *       200: { description: "Данные курса с прогрессом" }
 *       403: { description: "Требуется премиум-подписка" }
 *       404: { description: "Курс не найден" }
 *       500: { description: "Ошибка сервера" }
 */
router.get('/:courseId', isAuthenticated, courseController.getCourse);

/**
 * @swagger
 * /api/courses/{courseId}/lessons/{lessonId}:
 *   get:
 *     summary: Получение урока с прогрессом пользователя
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID курса
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID урока
 *     responses:
 *       200: { description: "Данные урока с прогрессом" }
 *       403: { description: "Требуется премиум-подписка" }
 *       404: { description: "Урок или курс не найден" }
 *       500: { description: "Ошибка сервера" }
 */
router.get('/:courseId/lessons/:lessonId', isAuthenticated, courseController.getLesson);

/**
 * @swagger
 * /api/courses/{courseId}/lessons/{lessonId}/complete:
 *   post:
 *     summary: Отметить урок как завершенный
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID курса
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID урока
 *     responses:
 *       200: { description: "Урок отмечен как завершенный" }
 *       403: { description: "Требуется премиум-подписка" }
 *       404: { description: "Урок или курс не найден" }
 *       500: { description: "Ошибка сервера" }
 */
router.post('/:courseId/lessons/:lessonId/complete', isAuthenticated, courseController.markLessonCompleted);

/**
 * @swagger
 * /api/courses/{courseId}/lessons/{lessonId}/homework:
 *   post:
 *     summary: Отправить домашнее задание
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID курса
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID урока
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               homework: { type: string, description: "Данные домашнего задания" }
 *     responses:
 *       200: { description: "Домашнее задание отправлено" }
 *       403: { description: "Требуется премиум-подписка" }
 *       404: { description: "Урок или курс не найден" }
 *       500: { description: "Ошибка сервера" }
 */
router.post('/:courseId/lessons/:lessonId/homework', isAuthenticated, courseController.submitHomework);

module.exports = router;