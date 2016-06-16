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
server.listen(1337, function() {
  console.log('The server is listening on port 1337!');
});


// Body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, '../public')));
app.use('/bot', router);

// Routes
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Sockets start here

var unmatched = [];

function coinFlip() {
  return Math.floor(Math.random() * 2 + 1);
}

function findPartner(mySocket) {

  // 50% chance of getting matched with a bot
  if (coinFlip() % 2) {
    return {id: 'bot'};

    // there are unmatched people
  } else if (unmatched.length > 0) {

    // make sure you don't get paired with yourself
    if (unmatched[0].id === mySocket.id) {
      return unmatched.splice(1, 1);
    } else {
      var partner = unmatched.shift();
      partner.partner = mySocket;
      return partner;
    }

    // there are no unmatched people, get added to the queue and wait
  } else if (unmatched.length < 1) {
    unmatched.push(mySocket);
    console.log('waiting for a partner');
  }
}


io.on('connection', function(socket) {
  console.log('-----------------');
  console.log(socket.id, 'connected');
  console.log('unmatched users after joining', unmatched.map(person => person.id))

  socket.partner = findPartner(socket)
  var partner = socket.partner || 'n/a'
  console.log('found a partner for', socket.id, ':', partner.id);
  console.log('unmatched users after match', unmatched.map(person => person.id));

  socket.on('chat message', function(msg) {

    // if your partner is a bot...
    if (socket.partner.id === 'bot') {
      console.log('chatting with bot', socket.id)
      // io.to() emits the response to the socket that sent the message only
      io.to(socket.id).emit('reply', bot.reply(socket.id, msg));

    // if your partner is human...
    } else {
      io.to(socket.partner.id).emit('reply', msg);
    }

  })

  socket.on('disconnect', function() {
    unmatched.splice(unmatched.indexOf(socket.id), 1)
    console.log('-----------------------');
    console.log('after ', socket.id, 'left:', unmatched)
    console.log(socket.id, 'disconnected from the server');
  });

});
