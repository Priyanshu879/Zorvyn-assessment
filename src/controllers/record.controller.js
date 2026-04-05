const recordService = require('../services/record.service');
const asyncHandler = require('../utils/asyncHandler');

const createRecord = asyncHandler(async (req, res) => {
  const record = await recordService.createRecord(req.body, req.user._id);
  return res.status(201).json({ success: true, data: record });
});

const getRecords = asyncHandler(async (req, res) => {
  const result = await recordService.getRecords(req.query);
  return res.status(200).json({ success: true, ...result });
});

const getRecordById = asyncHandler(async (req, res) => {
  const record = await recordService.getRecordById(req.params.id);
  return res.status(200).json({ success: true, data: record });
});

const updateRecord = asyncHandler(async (req, res) => {
  const record = await recordService.updateRecord(req.params.id, req.body);
  return res.status(200).json({ success: true, data: record });
});

const deleteRecord = asyncHandler(async (req, res) => {
  await recordService.softDeleteRecord(req.params.id);
  return res.status(200).json({ success: true, data: null });
});

module.exports = { createRecord, getRecords, getRecordById, updateRecord, deleteRecord };
