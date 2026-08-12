const express = require('express');
const router = express.Router();
const { create, list, getById, update, deactivate, reactivate, resendInvite } = require('../controllers/userController');
const auth = require('../middlewares/auth');
const { authorize } = require('../middlewares/roles');
const { checkSubscription, checkEmployeeLimit } = require('../middlewares/subscription');
const { ROLES } = require('../config/constants');

router.use(auth);

router.post('/', authorize(ROLES.ADMIN, ROLES.HR), checkSubscription, checkEmployeeLimit, create);
router.get('/', authorize(ROLES.ADMIN, ROLES.HR), list);
router.get('/:id', authorize(ROLES.ADMIN, ROLES.HR), getById);
router.put('/:id', authorize(ROLES.ADMIN, ROLES.HR), update);
router.patch('/:id/deactivate', authorize(ROLES.ADMIN, ROLES.HR), deactivate);
router.patch('/:id/reactivate', authorize(ROLES.ADMIN, ROLES.HR), reactivate);
router.post('/:id/resend-invite', authorize(ROLES.ADMIN, ROLES.HR), resendInvite);

module.exports = router;
