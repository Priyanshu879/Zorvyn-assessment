const { Router } = require('express');
const recordController = require('../controllers/record.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createRecordSchema, updateRecordSchema, recordQuerySchema } = require('../validators/record.validator');
const { idParamSchema } = require('../validators/common.validator');

const router = Router();

router.get(
  '/',
  authenticate, authorize('VIEWER', 'ANALYST', 'ADMIN'),
  validate(recordQuerySchema, 'query'),
  recordController.getRecords
);
router.get(
  '/:id',
  authenticate, authorize('VIEWER', 'ANALYST', 'ADMIN'),
  validate(idParamSchema, 'params'),
  recordController.getRecordById
);
router.post(
  '/',
  authenticate, authorize('ANALYST', 'ADMIN'),
  validate(createRecordSchema),
  recordController.createRecord
);
router.patch(
  '/:id',
  authenticate, authorize('ANALYST', 'ADMIN'),
  validate(idParamSchema, 'params'),
  validate(updateRecordSchema),
  recordController.updateRecord
);
router.delete(
  '/:id',
  authenticate, authorize('ADMIN'),
  validate(idParamSchema, 'params'),
  recordController.deleteRecord
);

module.exports = router;
