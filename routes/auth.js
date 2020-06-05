const express = require('express');
const { status, register, login, getMe, getUsers, forgotPassword, updateRating, follow, updateRole, updateUserPic, getListUsers, chatNotification, deleteChatNotification } = require('../controllers/auth');

// const router = express.Router();
const router = express();

const {protect, authorized} = require('../middleware/auth');

router.get('/status', status);
router.post('/register', register);
router.post('/register', register);
router.post('/login', login);
router.post('/:id/follow', protect, follow);
router.post('/:id/push-notification', chatNotification);
router.post('/:id/pull-notification', deleteChatNotification);
router.get('/:_id/me', getMe);
router.get('/users', getUsers);
router.get('/list-users', getListUsers);
router.post('/forgotPassword', forgotPassword);
router.put('/:id/updateRating', updateRating);
router.put('/:id/updateRole', protect, updateRole);
router.put('/:id/updateUserPic', protect, updateUserPic);


module.exports = router