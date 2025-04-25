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
 *       200:
 *         description: Список курсов с прогрессом
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: ID курса
 *                   title:
 *                     type: string
 *                     description: Название курса
 *                   description:
 *                     type: string
 *                     description: Описание курса
 *                   category:
 *                     type: string
 *                     enum: ['ПДД', 'Парковка']
 *                     description: Категория курса
 *                   lessons:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           description: ID урока
 *                         title:
 *                           type: string
 *                           description: Название урока
 *                         description:
 *                           type: string
 *                           description: Описание урока
 *                         videoUrl:
 *                           type: string
 *                           description: URL видео урока
 *                         additionalFiles:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                                 description: Название файла
 *                               url:
 *                                 type: string
 *                                 description: URL файла
 *                           description: Дополнительные файлы урока
 *                         order:
 *                           type: integer
 *                           description: Порядок урока в курсе
 *                     description: Список уроков курса
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     description: Дата создания курса
 *                   progress:
 *                     type: object
 *                     properties:
 *                       lastStudiedLesson:
 *                         type: string
 *                         nullable: true
 *                         description: ID последнего изученного урока
 *                       lessonsCompleted:
 *                         type: integer
 *                         description: Количество завершённых уроков
 *                     description: Прогресс пользователя по курсу
 *       403:
 *         description: Требуется премиум-подписка
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Ошибка сервера
 */
router.get('/', isAuthenticated, courseController.getCourse);

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
 *       200:
 *         description: Данные курса с прогрессом
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: ID курса
 *                 title:
 *                   type: string
 *                   description: Название курса
 *                 description:
 *                   type: string
 *                   description: Описание курса
 *                 category:
 *                   type: string
 *                   enum: ['ПДД', 'Парковка']
 *                   description: Категория курса
 *                 lessons:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: ID урока
 *                       title:
 *                         type: string
 *                         description: Название урока
 *                       description:
 *                         type: string
 *                         description: Описание урока
 *                       videoUrl:
 *                         type: string
 *                         description: URL видео урока
 *                       additionalFiles:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             name:
 *                               type: string
 *                               description: Название файла
 *                             url:
 *                               type: string
 *                               description: URL файла
 *                         description: Дополнительные файлы урока
 *                       order:
 *                         type: integer
 *                         description: Порядок урока в курсе
 *                   description: Список уроков курса
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                   description: Дата создания курса
 *                 progress:
 *                   type: object
 *                   properties:
 *                     lastStudiedLesson:
 *                       type: string
 *                       nullable: true
 *                       description: ID последнего изученного урока
 *                     lessons:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           lessonId:
 *                             type: string
 *                             description: ID урока
 *                           isCompleted:
 *                             type: boolean
 *                             description: Завершён ли урок
 *                           homeworkSubmitted:
 *                             type: boolean
 *                             description: Отправлено ли домашнее задание
 *                           homeworkData:
 *                             type: string
 *                             nullable: true
 *                             description: Данные домашнего задания
 *                       description: Прогресс по урокам
 *                   description: Прогресс пользователя по курсу
 *       404:
 *         description: Курс не найден
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Ошибка сервера
 */
router.get('/:courseId', isAuthenticated, courseController.getCourseById);

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
 *       200:
 *         description: Данные урока с прогрессом
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: ID урока
 *                 title:
 *                   type: string
 *                   description: Название урока
 *                 description:
 *                   type: string
 *                   description: Описание урока
 *                 videoUrl:
 *                   type: string
 *                   description: URL видео урока
 *                 additionalFiles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         description: Название файла
 *                       url:
 *                         type: string
 *                         description: URL файла
 *                   description: Дополнительные файлы урока
 *                 order:
 *                   type: integer
 *                   description: Порядок урока в курсе
 *                 progress:
 *                   type: object
 *                   properties:
 *                     lessonId:
 *                       type: string
 *                       description: ID урока
 *                     isCompleted:
 *                       type: boolean
 *                       description: Завершён ли урок
 *                     homeworkSubmitted:
 *                       type: boolean
 *                       description: Отправлено ли домашнее задание
 *                     homeworkData:
 *                       type: string
 *                       nullable: true
 *                       description: Данные домашнего задания
 *                   description: Прогресс пользователя по уроку
 *       404:
 *         description: Урок или курс не найден
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Ошибка сервера
 */
router.get('/:courseId/lessons/:lessonId', isAuthenticated, courseController.getLesson);

router.post(
  '/lessons/:lessonId/thumbnail',
  courseController.upload.single('thumbnail'),
  courseController.updateLessonThumbnail
);
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
 *       200:
 *         description: Урок отмечен как завершенный
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Сообщение об успешном завершении
 *                   example: "Lesson marked as completed"
 *                 lesson:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: ID урока
 *                     title:
 *                       type: string
 *                       description: Название урока
 *                     description:
 *                       type: string
 *                       description: Описание урока
 *                     videoUrl:
 *                       type: string
 *                       description: URL видео урока
 *                     additionalFiles:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             description: Название файла
 *                           url:
 *                             type: string
 *                             description: URL файла
 *                       description: Дополнительные файлы урока
 *                     order:
 *                       type: integer
 *                       description: Порядок урока в курсе
 *                     progress:
 *                       type: object
 *                       properties:
 *                         lessonId:
 *                           type: string
 *                           description: ID урока
 *                         isCompleted:
 *                           type: boolean
 *                           description: Завершён ли урок
 *                         homeworkSubmitted:
 *                           type: boolean
 *                           description: Отправлено ли домашнее задание
 *                         homeworkData:
 *                           type: string
 *                           nullable: true
 *                           description: Данные домашнего задания
 *                       description: Прогресс пользователя по уроку
 *       404:
 *         description: Урок или курс не найден
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Ошибка сервера
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
 *               homework:
 *                 type: string
 *                 description: Данные домашнего задания
 *     responses:
 *       200:
 *         description: Домашнее задание отправлено
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Сообщение об успешной отправке
 *                   example: "Homework submitted successfully"
 *                 lesson:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: ID урока
 *                     title:
 *                       type: string
 *                       description: Название урока
 *                     description:
 *                       type: string
 *                       description: Описание урока
 *                     videoUrl:
 *                       type: string
 *                       description: URL видео урока
 *                     additionalFiles:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             description: Название файла
 *                           url:
 *                             type: string
 *                             description: URL файла
 *                       description: Дополнительные файлы урока
 *                     order:
 *                       type: integer
 *                       description: Порядок урока в курсе
 *                     progress:
 *                       type: object
 *                       properties:
 *                         lessonId:
 *                           type: string
 *                           description: ID урока
 *                         isCompleted:
 *                           type: boolean
 *                           description: Завершён ли урок
 *                         homeworkSubmitted:
 *                           type: boolean
 *                           description: Отправлено ли домашнее задание
 *                         homeworkData:
 *                           type: string
 *                           nullable: true
 *                           description: Данные домашнего задания
 *                       description: Прогресс пользователя по уроку
 *       404:
 *         description: Урок или курс не найден
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Ошибка сервера
 */
router.post('/:courseId/lessons/:lessonId/homework', isAuthenticated, courseController.submitHomework);

/**
 * @swagger
 * /api/courses/{courseId}/lessons/{lessonId}/next-lesson:
 *   get:
 *     summary: Получение следующего урока
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
 *         description: ID текущего урока
 *     responses:
 *       200:
 *         description: Данные следующего урока с прогрессом
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: ID урока
 *                 title:
 *                   type: string
 *                   description: Название урока
 *                 description:
 *                   type: string
 *                   description: Описание урока
 *                 videoUrl:
 *                   type: string
 *                   description: URL видео урока
 *                 additionalFiles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         description: Название файла
 *                       url:
 *                         type: string
 *                         description: URL файла
 *                   description: Дополнительные файлы урока
 *                 order:
 *                   type: integer
 *                   description: Порядок урока в курсе
 *                 progress:
 *                   type: object
 *                   properties:
 *                     lessonId:
 *                       type: string
 *                       description: ID урока
 *                     isCompleted:
 *                       type: boolean
 *                       description: Завершён ли урок
 *                     homeworkSubmitted:
 *                       type: boolean
 *                       description: Отправлено ли домашнее задание
 *                     homeworkData:
 *                       type: string
 *                       nullable: true
 *                       description: Данные домашнего задания
 *                   description: Прогресс пользователя по уроку
 *       404:
 *         description: Курс, урок или следующий урок не найдены
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Ошибка сервера
 */
router.get('/:courseId/lessons/:lessonId/next-lesson', isAuthenticated, courseController.getNextLesson);

/**
 * @swagger
 * /api/courses/{courseId}/lessons/{lessonId}/prev-lesson:
 *   get:
 *     summary: Получение предыдущего урока
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
 *         description: ID текущего урока
 *     responses:
 *       200:
 *         description: Данные предыдущего урока с прогрессом
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: ID урока
 *                 title:
 *                   type: string
 *                   description: Название урока
 *                 description:
 *                   type: string
 *                   description: Описание урока
 *                 videoUrl:
 *                   type: string
 *                   description: URL видео урока
 *                 additionalFiles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         description: Название файла
 *                       url:
 *                         type: string
 *                         description: URL файла
 *                   description: Дополнительные файлы урока
 *                 order:
 *                   type: integer
 *                   description: Порядок урока в курсе
 *                 progress:
 *                   type: object
 *                   properties:
 *                     lessonId:
 *                       type: string
 *                       description: ID урока
 *                     isCompleted:
 *                       type: boolean
 *                       description: Завершён ли урок
 *                     homeworkSubmitted:
 *                       type: boolean
 *                       description: Отправлено ли домашнее задание
 *                     homeworkData:
 *                       type: string
 *                       nullable: true
 *                       description: Данные домашнего задания
 *                   description: Прогресс пользователя по уроку
 *       404:
 *         description: Курс, урок или предыдущий урок не найдены
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Ошибка сервера
 */
router.get('/:courseId/lessons/:lessonId/prev-lesson', isAuthenticated, courseController.getPrevLesson);

/**
 * @swagger
 * /api/courses/{courseId}/lessons/{lessonId}/watch:
 *   post:
 *     summary: Отметить урок как просмотренный
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
 *       200:
 *         description: Урок отмечен как просмотренный
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Сообщение об успешной отметке
 *                   example: "Lesson marked as watched"
 *                 lesson:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: ID урока
 *                     title:
 *                       type: string
 *                       description: Название урока
 *                     description:
 *                       type: string
 *                       description: Описание урока
 *                     videoUrl:
 *                       type: string
 *                       description: URL видео урока
 *                     additionalFiles:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             description: Название файла
 *                           url:
 *                             type: string
 *                             description: URL файла
 *                       description: Дополнительные файлы урока
 *                     order:
 *                       type: integer
 *                       description: Порядок урока в курсе
 *                     progress:
 *                       type: object
 *                       properties:
 *                         lessonId:
 *                           type: string
 *                           description: ID урока
 *                         isCompleted:
 *                           type: boolean
 *                           description: Завершён ли урок
 *                         homeworkSubmitted:
 *                           type: boolean
 *                           description: Отправлено ли домашнее задание
 *                         homeworkData:
 *                           type: string
 *                           nullable: true
 *                           description: Данные домашнего задания
 *                         isWatched:
 *                           type: boolean
 *                           description: Просмотрен ли урок
 *                       description: Прогресс пользователя по уроку
 *       404:
 *         description: Урок или курс не найден
 *       401:
 *         description: Не авторизован
 *       500:
 *         description: Ошибка сервера
 */
router.post('/:courseId/lessons/:lessonId/watch', isAuthenticated, courseController.markLessonWatched);

module.exports = router;