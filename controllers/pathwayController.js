const Pathway = require('../models/Pathway');

class PathwayController {
  async get(req, res) {
    try {
      const pathways = await Pathway.find();
      res.json(pathways);
    } catch (error) {
      res.status(500).json({ message: 'Ошибка сервера', error: error.message });
    }
  }
}

module.exports = new PathwayController();