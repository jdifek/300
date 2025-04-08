const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'API для экзамена ПДД',
    description: 'API для работы с билетами и экзаменами ПДД',
    version: '1.0.0'
  },
  host: process.env.API_URL || 'localhost:3000',
  basePath: '/api',
  schemes: ['http', 'https'],
  consumes: ['application/json'],
  produces: ['application/json'],
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      in: 'header',
      name: 'Authorization',
      description: 'JWT токен для авторизации'
    }
  },
  security: [{
    bearerAuth: []
  }],
  tags: [
    {
      name: 'Tickets',
      description: 'Операции с билетами'
    },
    {
      name: 'Exam',
      description: 'Операции с экзаменом'
    }
  ],
  definitions: {
    Ticket: {
      type: 'object',
      properties: {
        number: {
          type: 'integer',
          description: 'Номер билета'
        },
        questions: {
          type: 'array',
          items: {
            $ref: '#/definitions/Question'
          }
        }
      }
    },
    Question: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Текст вопроса'
        },
        imageUrl: {
          type: 'string',
          description: 'Ссылка на изображение'
        },
        options: {
          type: 'array',
          items: {
            $ref: '#/definitions/Option'
          }
        },
        hint: {
          type: 'string',
          description: 'Подсказка'
        },
        videoUrl: {
          type: 'string',
          description: 'Ссылка на видеоразбор'
        },
        category: {
          type: 'string',
          description: 'Категория вопроса'
        }
      }
    },
    Option: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Текст варианта ответа'
        },
        isCorrect: {
          type: 'boolean',
          description: 'Правильный ли это ответ'
        }
      }
    },
    Exam: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'ID пользователя'
        },
        ticketNumber: {
          type: 'integer',
          description: 'Номер билета'
        },
        questions: {
          type: 'array',
          items: {
            $ref: '#/definitions/ExamQuestion'
          }
        },
        extraQuestions: {
          type: 'array',
          items: {
            $ref: '#/definitions/ExamQuestion'
          }
        },
        mistakes: {
          type: 'integer',
          description: 'Количество ошибок'
        },
        status: {
          type: 'string',
          enum: ['in_progress', 'passed', 'failed'],
          description: 'Статус экзамена'
        },
        startTime: {
          type: 'string',
          format: 'date-time',
          description: 'Время начала экзамена'
        },
        timeLimit: {
          type: 'integer',
          description: 'Лимит времени в миллисекундах'
        },
        extraTime: {
          type: 'integer',
          description: 'Дополнительное время в миллисекундах'
        }
      }
    },
    ExamQuestion: {
      type: 'object',
      properties: {
        questionId: {
          type: 'string',
          description: 'ID вопроса'
        },
        userAnswer: {
          type: 'integer',
          description: 'Ответ пользователя'
        },
        isCorrect: {
          type: 'boolean',
          description: 'Правильный ли ответ'
        }
      }
    }
  }
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./routes/*.js'];

swaggerAutogen(outputFile, endpointsFiles, doc);
