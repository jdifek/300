const { body, param } = require('express-validator');
const ApiError = require('../exceptions/api-error');

const validateExamStart = [
  body('userId')
    .notEmpty()
    .withMessage('ID пользователя обязателен')
    .isMongoId()
    .withMessage('Неверный формат ID пользователя')
];

const validateAnswer = [
  param('examId')
    .notEmpty()
    .withMessage('ID экзамена обязателен')
    .isMongoId()
    .withMessage('Неверный формат ID экзамена'),
  body('questionIndex')
    .notEmpty()
    .withMessage('Индекс вопроса обязателен')
    .isInt({ min: 0 })
    .withMessage('Индекс вопроса должен быть неотрицательным числом'),
  body('userAnswer')
    .notEmpty()
    .withMessage('Ответ обязателен')
    .isInt({ min: 0, max: 3 })
    .withMessage('Ответ должен быть числом от 0 до 3')
];

const validateExamId = [
  param('examId')
    .notEmpty()
    .withMessage('ID экзамена обязателен')
    .isMongoId()
    .withMessage('Неверный формат ID экзамена')
];

module.exports = {
  validateExamStart,
  validateAnswer,
  validateExamId
}; 