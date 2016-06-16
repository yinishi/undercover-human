var http = require('http');
var server = http.createServer();

var express = require('express');
var app = express();
var router = require('./routes');

server.on('request', app);

/* INITIALIZE SOCKETS */
require('./sockets.js')(server);

var path = require('path');
var bodyParser = require('body-parser');


/* LOAD THE BOT */
var Bot = require('./bot');
var bot = Bot.bot;
bot.loadDirectory(__dirname + '/bot/brain', Bot.success_handler, Bot.error_handler);

/* START SERVER */
server.listen(1337, function() {
  console.log('The server is listening on port 1337!');
});

/* MIDDLEWARE */
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, '../public')));
app.use('/bot', router);

/* ROUTES */
app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, 'index.html'));
});

