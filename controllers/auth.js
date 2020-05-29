
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');
const path = require('path');
var fs = require('fs');
var ObjectId = require('mongodb').ObjectID;

// @desc Register User
// route /api/v1/auth/register
// @access Public

exports.register = async (req, res, next) => {
    try {
        const { username, email, password, role, mayor, terminos, notificaciones, nacimiento } = req.body;

        if (req.body.mayor === false) {
            return next(new ErrorResponse('No authortized', 404));
        }

        // Create user
        const user = await User.create({
            username,
            email,
            password,
            role,
            mayor,
            terminos,
            notificaciones,
            nacimiento
        });

        sendTokenResponse(user, 200, res);
    } catch (err) {
        next(err);
    }
}

// @desc Login User
// route /api/v1/auth/login
// @access Public

exports.login = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return next(new ErrorResponse('Please provide an username and a password', 400))
        }

        // Check for the user
        const user = await User.findOne({ username }).select('+password');

        if (!user) {
            return next(new ErrorResponse('Invalid Credentials', 401));
        }

        //Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return next(new ErrorResponse('Invalid Credentials', 401));
        }

        sendTokenResponse(user, 200, res);
    } catch (err) {
        next(err);
    }
}

//Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    const token = user.getSignedJwtToken();

    const options = {
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res.status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token,
            user
        })
}

// @desc Get current logged in user
// route /api/v1/auth/me
// @access Private

exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.params._id).populate('ph_sets').populate('model_sets').populate('my_follows').populate('followers');

        res.status(200).json({
            success: true,
            data: user
        })
    } catch (err) {
        next(err);
    }
}

// @desc Forgot password
// route /api/v1/auth/forgotpassword
// @access Public

exports.forgotPassword = async (req, res, next) => {
    try {
        const user = await User.findOne({ username: req.body.username })

        if (!user) {
            return next(new ErrorResponse('There is no user with that username', 404));
        }

        const resetToken = user.getResetPasswordToken();

        await user.save({ validateBeforeSave: false })

        res.status(200).json({
            success: true,
            data: user
        })
    } catch (err) {
        next(err);
    }
}

// @desc Update Rating
// route /api/v1/auth/:id/updateRating
// @access Public

exports.updateRating = async (req, res, next) => {
    try {

        let user = await User.findByIdAndUpdate(
            { _id: req.params.id },
            { $inc: { amountRating: 1, totalRating: req.body.rating }, },
            { new: true }

        )


        res.status(200).json({
            success: true,
            data: user
        })
    } catch (err) {
        next(err);
    }
}

exports.updateRole = async (req, res, next) => {
    try {

        let user = await User.findByIdAndUpdate(
            { _id: req.params.id },
            { role: req.body.role }
        )

        res.status(200).json({
            success: true,
            data: user
        })
    } catch (err) {
        next(err);
    }
}

exports.updateUserPic = async (req, res, next) => {
    try {

        const user = await User.findById(req.params.id)
        if (!user) {
            next(new ErrorResponse(`User not found with id of ${req.params.id}`), 404);
        }
        if (!req.files) {
            return next(new ErrorResponse(`Please upload a file`, 400))
        }

        const file = req.files.file

        console.log(file);

        // Make sure that the file is a photo
        if (!file.mimetype.startsWith('image')) {
            return next(new ErrorResponse(`Please upload an image file`, 400))
        }

        // Check file size
        if (file.size > process.env.MAX_FILE_UPLOAD) {
            return next(new ErrorResponse(`Please upload an image less than ${process.env.MAX_FILE_UPLOAD} `, 400))
        }

        // create custom name
        file.name = `user_pic_${user._id}${path.parse(file.name).ext}`

        // Make sure picture has jpg extension
        // if (!file.name.includes('.jpg') || !file.name.includes('.JPG') || !file.name.includes('jpeg')) {
        //     return next(new ErrorResponse(`Please upload an image with jpg extension`, 400))
        // }

        const dir_main = `${process.env.FILE_UPLOAD_PATH}/users/${user._id}/user_pic`

        if (!fs.existsSync(dir_main)) {
            fs.mkdirSync(dir_main, { recursive: true }, err => { });
        }

        file.mv(`${dir_main}/${file.name}`, async (error) => {
            if (error) {
                return next(new ErrorResponse(`Problem with the file apload `, 500))
            }
            await User.findByIdAndUpdate(req.params.id, { userPic: file.name });
            res.status(200).json({
                success: true,
                data: file.name
            })
        })

        res.status(200).json({
            success: true,
            data: user
        })
    } catch (err) {
        next(err);
    }
}

exports.follow = async (req, res, next) => {
    try {


        let user = await User.findByIdAndUpdate(
            { _id: req.params.id },
            { $push: { followers: req.user.id } },

        )


        res.status(200).json({
            success: true,
            data: user
        })
    } catch (err) {
        next(err);
    }
}

exports.chatNotification = async (req, res, next) => {
    try {

        let user = await User.findByIdAndUpdate(
            { _id: req.params.id },
            { $push: { chatNotification: req.body._id } },
            { new: true }
        )

        let receiver = await User.findByIdAndUpdate(
            { _id: req.body._id },
            { $inc: { chatCounter: 1 } },
            { new: true }
        )

        res.status(200).json({
            success: true,
            data: {
                user,
                receiver
            }
        })
    } catch (err) {
        next(err);
    }
}

exports.deleteChatNotification = async (req, res, next) => {
    try {

        let user = await User.findByIdAndUpdate(
            { _id: req.params.id },
            { $pull: { chatNotification: req.body._id } },
            { new: true }
        )

        let receiver = await User.findByIdAndUpdate(
            { _id: req.body._id },
            { chatCounter: 0 },
            { new: true }
        )

        res.status(200).json({
            success: true,
            data: {
                user,
                receiver
            }
        })
    } catch (err) {
        next(err);
    }
}

exports.getListUsers = async (req, res, next) => {
    try {

        var ids = req.query.allId.split(',')
        var objId = []
        ids.forEach(id => {
            objId.push(ObjectId(id))
        });

        let user = await User.find({ "_id": { $in: objId } });
        res.status(200).json({
            success: true,
            data: user
        })
    } catch (err) {
        next(err);
    }
}

exports.getUsers = async (req, res, next) => {
    let query;

    // copy req.Query
    const reqQuery = { ...req.Query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];

    //Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    console.log(reqQuery);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // create operators ($gt, gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`)

    if (!req.query.username && !req.query._id && !req.query.allId && !req.query.all) {
        query = User.find(JSON.parse(queryStr)).populate('ph_sets').populate('model_sets').populate('my_follows').populate('followers');
    }

    if (req.query.username) {
        query = User.find({ "username": { $regex: req.query.username }, "role": ["photographer", "model"] }).populate('ph_sets').populate('model_sets').populate('my_follows').populate('followers');
    }

    if (req.query.all) {
        query = User.find({ "username": { $regex: req.query.all } }).populate('ph_sets').populate('model_sets').populate('my_follows').populate('followers');
    }


    if (req.query.allId) {
        query = User.find({ "_id": { $in: req.query.allId } });
    }

    if (req.query._id) {
        query = User.find({ "_id": req.query._id }).populate('ph_sets').populate('model_sets').populate('my_follows').populate('followers');
    }

    // Select Fields
    if (req.query.select) {
        const fields = req.query.select.split(',').join(' ');
        query = query.select(fields)
    }

    // Sort
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy)
    } else {
        query = query.sort('-createdAt');
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await User.countDocuments();

    query = query.skip(startIndex).limit(limit);

    // Pagination result
    const pagination = {}

    if (endIndex < total) {
        pagination.next = {
            page: page + 1,
            limit
        }
    }

    if (startIndex > 0) {
        pagination.prev = {
            page: page - 1,
            limit
        }
    }

    const users = await query;

    res.status(200).json({ success: true, count: users.length, pagination: pagination, data: users })
}

