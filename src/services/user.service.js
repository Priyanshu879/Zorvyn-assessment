const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const AppError = require('../utils/AppError');

const createUser = async (data) => {
  const hashed = await bcrypt.hash(data.password, 10);
  const user = await User.create({ ...data, password: hashed });
  return User.findById(user._id).select('-password');
};

const getAllUsers = async ({ status } = {}) => {
  const filter = {};
  if (status) filter.status = status;
  return User.find(filter).select('-password');
};

const getUserById = async (id) => {
  const user = await User.findById(id).select('-password');
  if (!user) throw new AppError('User not found', 404);
  return user;
};

const updateUser = async (id, data) => {
  const user = await User.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).select('-password');
  if (!user) throw new AppError('User not found', 404);
  return user;
};

const deleteUser = async (id) => {
  return User.findByIdAndDelete(id);
};

module.exports = { createUser, getAllUsers, getUserById, updateUser, deleteUser };
