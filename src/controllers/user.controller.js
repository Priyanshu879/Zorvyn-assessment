const userService = require('../services/user.service');
const asyncHandler = require('../utils/asyncHandler');

const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body);
  return res.status(201).json({ success: true, data: user });
});

const getAllUsers = asyncHandler(async (req, res) => {
  const users = await userService.getAllUsers(req.query);
  return res.status(200).json({ success: true, data: users });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  return res.status(200).json({ success: true, data: user });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);
  return res.status(200).json({ success: true, data: user });
});

const deleteUser = asyncHandler(async (req, res) => {
  const deleted = await userService.deleteUser(req.params.id);
  if (!deleted) {
    return res.status(404).json({ success: false, error: { message: 'User not found' } });
  }
  return res.status(200).json({ success: true, data: null });
});

module.exports = { createUser, getAllUsers, getUserById, updateUser, deleteUser };
