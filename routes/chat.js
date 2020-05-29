const express = require('express');
const {getMessages, getAllChatsUser, deleteMessages} = require('../controllers/chats')

const router = express.Router();

const {protect, authorized} = require('../middleware/auth');

router.route('/:user/:receiver')
    .get(getMessages)

router.route('/:user/:receiver')
    .delete(deleteMessages)

router.route('/:user')
    .get(getAllChatsUser)

module.exports = router;
