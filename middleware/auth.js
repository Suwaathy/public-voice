const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  console.log('🔐 AUTH MIDDLEWARE');

  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    console.log('❌ NO TOKEN');
    return res.status(401).json({ message: 'No token. Access denied.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ TOKEN VALID');
    req.user = decoded;
    next();
  } catch (err) {
    console.log('❌ INVALID TOKEN');
    res.status(401).json({ message: 'Invalid token.' });
  }
};