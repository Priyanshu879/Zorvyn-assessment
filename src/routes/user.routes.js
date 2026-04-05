const { Router } = require('express');
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createUserSchema, updateUserSchema, getUsersQuerySchema } = require('../validators/user.validator');
const { idParamSchema } = require('../validators/common.validator');

const router = Router();

router.use(authenticate, authorize('ADMIN'));

router.post('/', validate(createUserSchema), userController.createUser);
router.get('/', validate(getUsersQuerySchema, 'query'), userController.getAllUsers);
router.get('/:id', validate(idParamSchema, 'params'), userController.getUserById);
router.patch('/:id', validate(idParamSchema, 'params'), validate(updateUserSchema), userController.updateUser);
router.delete('/:id', validate(idParamSchema, 'params'), userController.deleteUser);

module.exports = router;
