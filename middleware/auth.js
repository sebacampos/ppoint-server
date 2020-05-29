const jwt = require('jsonwebtoken');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');

// protect routes

exports.protect = async (req, res, next) => {
    try {
        let token

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // else if (req.cookies.token) {
        //     token = req.cookies.token
        // }

        // Make sure token exists
        if (!token) {
            return next(new ErrorResponse('not authorized to access this route'), 401);
        }

        try {
            // verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            console.log(decoded);

            req.user = await User.findById(decoded.id)

            next();
        } catch(err) {
            return next(new ErrorResponse('not authorized to access this route'), 401);
        }
    } catch(err) {
        next(err);
    }
}

// Grant access to specific roles
exports.authorized = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new ErrorResponse(`User role ${req.user.role} is not authorized to access this route`), 403);
        }
        next();
    }
}