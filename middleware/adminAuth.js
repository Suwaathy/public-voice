const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No admin token. Access denied.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    req.admin = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid admin token.' });
  }
};

