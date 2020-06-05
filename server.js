const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const morgan = require('morgan');
const fileupload = require('express-fileupload');
const colors = require('colors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error')
const cookieParser = require('cookie-parser');
const app = express();
var http = require('http').Server(app);

var chatSchema = require('./models/Chat');

const sets = require('./routes/sets');
const auth = require('./routes/auth');
const chat = require('./routes/chat');

dotenv.config({ path: './config/config.env'} );

connectDB();


app.use(express.json());

app.use(cookieParser());

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

app.use(fileupload());

// Set static folder
app.use(express.static(path.join(__dirname, 'public')))

app.use('/api/v1/sets', sets);
app.use('/api/v1/auth', auth);
app.use('/api/v1/chat', chat);

app.use(errorHandler);



const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, console.log(`server running on ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold));

var io = require('socket.io')(server)

//listen on every connection

io.on("connection", (socket) => {
    console.log("usuario conectado");

    io.on("disconnect", () => {
        console.log("usuario desconectado");
    });

    io.on("typing", data => {
        socket.broadcast.emit("notifyTyping", {
            user: data.user,
            message: data.message
        });
    });

    //when soemone stops typing
    socket.on("stopTyping", () => {
        socket.broadcast.emit("notifyStopTyping");
    });
    
    socket.on("chat message", async (msg, user, receiver) => {
        

        socket.broadcast.emit("received", {
            message: msg,
            user: user,
            receiver: receiver
        });
        let info = {
            message: msg,
            user: user,
            receiver: receiver
        }
        io.emit('MESSAGE', info)
        
        var findUserAndReceiver = await chatSchema.findOne({user : user, receiver: receiver})
        console.log(findUserAndReceiver);
        
        if (!findUserAndReceiver) {
            
            chatSchema.create({
                user: user,
                receiver: receiver,
                messages: {
                    msg: msg,
                    date: Date.now(),
                    user: user
                } 
            });
        }

        if (findUserAndReceiver) {
            
            await chatSchema.findOneAndUpdate(
                { user : user, receiver: receiver },
                { $push: {messages: {
                    msg: msg,
                    date: Date.now(),
                    user: user
                }}}
            )
        }
    });

});



process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`)
    server.close(() => process.exit(1))
});