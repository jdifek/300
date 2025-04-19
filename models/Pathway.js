const mongoose = require('mongoose')

const PathwayShema = new mongoose.Schema({
  videoUrl: {type: String, required: true},
  town: {type: String, required: true}
})

module.exports = mongoose.model("Pathway", PathwayShema)