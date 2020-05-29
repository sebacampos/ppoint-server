const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    messages: {type: [Object]},
    receiver: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// foreing data to add:

module.exports = mongoose.model('Chat', ChatSchema); 