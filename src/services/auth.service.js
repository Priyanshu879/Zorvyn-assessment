const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { createUser } = require('./user.service');
const AppError = require('../utils/AppError');

const signToken = (userId, role) =>
  jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: '7d' });

const register = async ({ name, email, password, role }) => {
  const user = await createUser({ name, email, password, role });
  const token = signToken(user._id, user.role);
  return { user, token };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) throw new AppError('Invalid email or password', 401);

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new AppError('Invalid email or password', 401);

  if (user.status !== 'ACTIVE') throw new AppError('Account is inactive', 401);

  const token = signToken(user._id, user.role);
  user.password = undefined;
  return { user, token };
};

module.exports = { register, login };
