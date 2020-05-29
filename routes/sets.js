const express = require('express');
const {getSets, getSet, deleteSet, updateSet, createSet, setUploadMainPic, setUploadFreePics, setUploadPremiumPics} = require('../controllers/sets')

const router = express.Router();

const {protect, authorized} = require('../middleware/auth');

router.route('/:id/mainPic').put(protect, authorized('photographer', 'admin'), setUploadMainPic);
router.route('/:id/freePics').put(protect, authorized('photographer', 'admin'), setUploadFreePics);
router.route('/:id/premiumPics').put(protect, authorized('photographer', 'admin'), setUploadPremiumPics);

router
    .route('/')
    .get(getSets)
    .post(protect, authorized('photographer', 'admin'), createSet)

router.route('/:id')
    .get(getSet)
    .put(protect, authorized('photographer', 'admin'), updateSet)
    .delete(protect, authorized('photographer', 'admin'), deleteSet)

module.exports = router;
