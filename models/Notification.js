const mongoose = require('mongoose')

const NotifacationShema = new mongoose.Schema({
  title: {type: String, required: true},
  description: { type: String, required: true }
})

module.exports = mongoose.model('Notification', NotifacationShema);
