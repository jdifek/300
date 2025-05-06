const mongoose = require('mongoose');
const Pathway = require('./models/Pathway.js');
require('dotenv').config();

async function importPathway(jsonData) {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('Connected to MongoDB');
    }

    await Pathway.deleteMany({});
    console.log('Cleared existing pathways in DB');

    const result = await Pathway.insertMany(jsonData);
    console.log(`Imported ${result.length} pathways successfully`);
  } catch (error) {
    console.error('Error importing pathways:', error);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
  }
}

const pathwayData = require('./pathways.json');
importPathway(pathwayData);
