const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
    // name: {
    //     type: String,
    //     required: [true, 'Please add a name'],
    //     maxlength: [50, 'Name can not be more than 50 characters']
    // },
    // last_name: {
    //     type: String,
    //     maxlength: [50, 'Name can not be more than 50 characters']
    // },
    email: {
        type: String,
        unique: true,
        required: [true, 'please add an email']
    },
    username: {
        type: String,
        unique: true,
        required: true
    },
    userPic: {
        type: String
    },
    nacimiento: {
        type: Date,
        required: [true, 'plase add a birth date']
    },
    mayor: {
        type: Boolean,
    },
    terminos: {
        type: Boolean
    },
    notificaciones: {
        type: Boolean
    },
    profile_pic: {
        type: String
    },
    location: {
        type: String
    },
    likes: {
        type: Number
    },
    amountRating: {
        type: Number,
        default: 0 
    },
    totalRating: {
        type: Number,
        default: 0
    },
    role: {
        type: String,
        enum: [
            'normal_user',
            'primium_user',
            'model',
            'photographer'  
        ],
        default: 'normal_user'
    },
    chatNotification: {
        type: [String]
    },
    chatCounter: {
        type: Number
    },
    password: {
        type: String,
        required: [true, 'please add a password'],
        minlength: 6,
        select: false
    },
    followers: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }],
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }

}, {
    toJSON: { virtuals: true },
    toOject: { virtuals: true }
});

// encrypt password using bcrypt
UserSchema.pre('save', async function(next) {

    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return 
UserSchema.methods.getSignedJwtToken = function() {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET);
}

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password)
}

// Reverse populate with virtuals

UserSchema.virtual('ph_sets', {
    ref: 'Set',
    localField: '_id',
    foreignField: 'photographer',
    justOne: false
})

UserSchema.virtual('model_sets', {
    ref: 'Set',
    localField: '_id',
    foreignField: 'models',
    justOne: false
})

UserSchema.virtual('my_follows', {
    ref: 'User',
    localField: '_id',
    foreignField: 'followers',
    justOne: false
})

// Generate and hash password token

UserSchema.methods.getResetPasswordToken = function() {
    // generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // hash token and set resetPasswordToken field
    this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // set expire
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    return resetToken;

}

module.exports = mongoose.model('User', UserSchema);