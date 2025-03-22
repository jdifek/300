const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'Driving App API',   // Заголовок API
    description: 'API documentation for the Driving App',  // Описание API
  },
  host: 'localhost:5000', // Адрес, по которому доступен API
  schemes: ['http'], // Протокол
};

// Путь до файлов с роутами, которые нужно обработать
const outputFile = './swagger-output.json';  // Путь, куда будет сохранён JSON с документацией
const endpointsFiles = ['./routes/userRoutes.js'];  // Файлы с роутами, которые нужно анализировать

// Генерация Swagger документации
swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  require('./server.js'); // Запуск сервера после генерации документации
});
