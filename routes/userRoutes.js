// routes/userRoutes.js - с добавлением Swagger-документации
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
 * /api/users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       201: { description: User created }
 *       400: { description: Email already exists }
 *       500: { description: Server error }
 */
router.post('/register', userController.register);

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Successful login }
 *       401: { description: Invalid credentials }
 *       500: { description: Server error }
 */
router.post('/login', userController.login);

/**
 * @swagger
 * /api/users/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200: { description: New tokens generated }
 *       401: { description: Invalid refresh token }
 */
router.post('/refresh', userController.refreshToken);

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: User profile }
 *       401: { description: Unauthorized }
 *       404: { description: User not found }
 *       500: { description: Server error }
 */
router.get('/profile', isAuthenticated, userController.getProfile);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
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
 *               username: { type: string }
 *               avatar: { type: string }
 *     responses:
 *       200: { description: Updated profile }
 *       401: { description: Unauthorized }
 *       404: { description: User not found }
 *       500: { description: Server error }
 */
router.put('/profile', isAuthenticated, userController.updateProfile);

/**
 * @swagger
 * /api/users/subscription:
 *   put:
 *     summary: Update user subscription
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
 *               type: { type: string, enum: [free, premium] }
 *               autoRenew: { type: boolean }
 *     responses:
 *       200: { description: Updated subscription }
 *       401: { description: Unauthorized }
 *       404: { description: User not found }
 *       500: { description: Server error }
 */
router.put('/subscription', isAuthenticated, userController.updateSubscription);

/**
 * @swagger
 * /api/users/progress:
 *   get:
 *     summary: Get user progress
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: User progress }
 *       401: { description: Unauthorized }
 *       404: { description: User not found }
 *       500: { description: Server error }
 */
router.get('/progress', isAuthenticated, userController.getProgress);

module.exports = router;