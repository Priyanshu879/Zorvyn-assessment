const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const authenticate = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required' },
    });
  }

  const token = header.slice(7);
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid or expired token' },
    });
  }

  const user = await User.findById(payload.userId);
  if (!user || user.status !== 'ACTIVE') {
    return res.status(401).json({
      success: false,
      error: { message: 'User not found or inactive' },
    });
  }

  req.user = user;
  next();
};

const authorize = (...allowedRoles) => (req, res, next) => {
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: { message: `Access denied. Required roles: ${allowedRoles.join(', ')}` },
    });
  }
  next();
};

module.exports = { authenticate, authorize };
