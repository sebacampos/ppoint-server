const Chat = require('../models/Chat');
const ErrorResponse = require('../utils/errorResponse');

exports.getMessages = async (req, res, next) => {
   try {
    const messages = await Chat.find({
      "user" : { "$in": [req.params.user, req.params.receiver] },
      "receiver" : { "$in": [req.params.user, req.params.receiver] }
    })
    res.status(200).json({
      success: true,
      data: messages
    })
   } catch(err) {
     next(err);
   }
};

exports.deleteMessages = async (req, res, next) => {
   try {
    const messages = await Chat.remove({
      "user" : { "$in": [req.params.user, req.params.receiver] },
      "receiver" : { "$in": [req.params.user, req.params.receiver] }
    })
    res.status(200).json({
      success: true,
      data: messages
    })
   } catch(err) {
     next(err);
   }
};

exports.getAllChatsUser = async (req, res, next) => {
   try {
    const chats = await Chat.find({
     $or: [{"user" :  req.params.user}, {"receiver" :  req.params.user} ] 
    }, {user: 1, receiver: 1})
    res.status(200).json({
      success: true,
      data: chats
    })
   } catch(err) {
     next(err);
   }
};

// if (req.query.allId) {
//   query = User.find({"_id": {$in: req.query.allId}});
// }
