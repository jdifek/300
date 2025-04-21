require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes'); // Новый роут
const ticketRoutes = require('./routes/ticketRoutes');
const examRoutes = require('./routes/examRoutes');
const pathwayRoutes = require('./routes/examPathways.js');
const notificationRoutes = require('./routes/notificationRoute.js');
const app = express();

app.use(express.json());
app.use(cors());
require("dotenv").config();


const PORT = process.env.PORT || 5000;
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${PORT}`;

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Driving App API',
      version: '1.0.0',
      description: 'API for driving education application'
    },
    servers: [
      {
        url: BACKEND_URL
      }
    ]
  },
  apis: ['./routes/*.js']
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {console.log('✅ MongoDB connected')})
  .catch(err => console.error('❌ MongoDB connection error:', err));

app.use('/api/courses', courseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/exam', examRoutes);
app.use('/api/notification', notificationRoutes);
app.use('/api/pathway', pathwayRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📄 Swagger docs available at ${BACKEND_URL}/api-docs`);
});
