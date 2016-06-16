
var path = require('path');
var bodyParser = require('body-parser')

var http = require('http');
var server = http.createServer();

var express = require('express');
var app = express();
var router = require('./routes');

var socketio = require('socket.io');

server.on('request', app);

var io = socketio(server);

/* LOAD THE BOT */
var Bot = require('./bot');
var bot = Bot.bot;
bot.loadDirectory(__dirname + '/bot/brain', Bot.success_handler, Bot.error_handler);

/* START SERVER */
server.listen(1337, function () {
    console.log('The server is listening on port 1337!');
});


// Body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, '../public')));
app.use('/bot', router)

// Routes
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// app.get('/:room', function (req, res) {
//     res.sendFile(path.join(__dirname, 'index.html'));
// });


// Sockets start here

io.on('connection', function(socket) {
  console.log(socket.id, 'connected');

  socket.on('chat message', function(msg) {
    setTimeout(function() {
      io.emit('chat message', bot.reply("local-user", msg));
    }, Math.random() * 6000)
    
  })

  socket.on('disconnect', function() {
    console.log(socket.id, 'disconnected from the server');
  });

});