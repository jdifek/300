const User = require('../models/User');

exports.isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') { // Предполагается поле role в UserSchema
      return res.status(403).json({ message: 'Требуются права администратора' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
};