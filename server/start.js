var http = require('http');
var server = http.createServer();

var express = require('express');
var app = express();
var router = require('./routes');

var path = require('path');

server.on('request', app);

var PORT = process.env.PORT || 1337

/* INITIALIZE SOCKETS */
require('./sockets.js')(server);


/* LOAD THE BOT */
var Bot = require('./bot');
var bot = Bot.bot;
bot.loadDirectory(__dirname + '/bot/brain', Bot.success_handler, Bot.error_handler);

/* START SERVER */
server.listen(PORT, function() {
  console.log('The server is listening on port ' + PORT);
});

app.use(express.static(path.join(__dirname, '../public')));
app.use('/bot', router);

/* ROUTES */
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'index.html'));
});

