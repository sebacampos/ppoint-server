const mongoose = require('mongoose');

const SetSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        unique: true,
        trim: true,
        maxlength: [50, 'Name can not be more than 50 characters']
    },
    finalPrice: {
        type: Number,
        required: [true, 'please add a price']
    },
    pictures: {
        type: [String],
    },
    freePictures: {
        type: [String],
    },
    promo: {
        type: Number,
    },
    states: {
        type: [String],
        enum: [
            'Pending',
            'On revision',
            'Published',
            'Rejected'
        ]
    },
    selectedState: {
        type: String,
        default: 'Pending'
    },
    description: {
        type: String,
        maxlength: 250
    },
    mainPicture: {
        type: String
    },
    likes: {
        type: Number
    },
    comments: {
        type: [String]
    },
    tag: {
        type: String,
        required: [true, 'Please add a tag']
    },
    content: {
        type: Number,
        min: [1, 'One'],
        max: [5, 'Five']
    },
    creativity: {
        type: Number,
        min: [1, 'One'],
        max: [5, 'Five']
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    photographer: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    models: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }],
    buyers: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }]

});

// foreing data to add:

module.exports = mongoose.model('Set', SetSchema); 