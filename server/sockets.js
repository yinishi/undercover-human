var socketio = require('socket.io');
var bot = require('./bot').bot;

var unmatched = [];
var timeout = Math.random() * 6000;

function coinFlip() {
  return Math.floor(Math.random() * 2 + 1);
}

function findPartner(socket) {

  // 50% chance of getting matched with a bot
  if (coinFlip() % 2) {
    return { id: 'bot' };

    // there are unmatched people
  } else if (unmatched.length > 0) {
    // if (unmatched.length > 0) {

    // make sure you don't get paired with yourself
    if (unmatched[0].id === socket.id) {
      return unmatched.splice(1, 1);
    } else {
      var partner = unmatched.shift();
      partner.partner = socket;
      return partner;
    }

    // there are no unmatched people, get added to the queue and wait
  } else if (unmatched.length < 1) {
    unmatched.push(socket);
    console.log(socket.id);
    console.log('waiting for a partner');
  }
}

module.exports = function(server) {
  var io = socketio(server);

  io.on('connection', function(socket) {
    console.log('-----------------');
    console.log(socket.id, 'connected');
    console.log('unmatched users after joining', unmatched.map(person => person.id));

    io.to(socket.id).emit('match status', { msg: 'waiting for partner...' });

    // not matched: emit waiting message
    setTimeout(sendMatch, timeout);
    // matched: send connected message

    function sendMatch() {
      // upon connection, either get matched with a partner or get added to the unmatched queue
      socket.partner = findPartner(socket);
      console.log(socket, 'is matched');
      console.log('unmatched users after match', unmatched.map(person => person.id));
      if (socket.partner) {
        var data = { msg: 'you have been matched... start chatting!', socket: socket.id, partner: socket.partner.id }
        io.to(socket.partner.id).emit('match status', data);
        io.to(socket.id).emit('match status', data);

      }
    }


    ////////////////////
    /// CHAT MESSAGE ///
    ////////////////////

    // upon receiving the first message...
    socket.on('chat message', function(msg) {
      // if your partner is a bot...
      if (socket.partner.id === 'bot') {
        console.log(socket.id, 'is chatting with bot');
        // io.to() emits the response to the socket that sent the message only

        setTimeout(function() {
          io.to(socket.id).emit('reply', bot.reply(socket.id, msg));
        }, timeout);


        // if your partner is human...
      } else {
        io.to(socket.partner.id).emit('reply', msg);
      }
    });


    ///////////////////
    ///    NEXT     ///
    ///////////////////

    socket.on('next', function() {
      // first, emit waiting message
      io.to(socket.id).emit('match status', { msg: 'waiting for a new partner...' });

      if (socket.partner && socket.partner !== 'disconnected') {
        console.log('--------------------');
        console.log(socket.id, 'disconnected from their partner,', socket.partner.id);
        var oldPartner = socket.partner;


        // tell your old partner that you left
        var data = { msg: 'your partner left. please assess them before moving on.', socket: oldPartner.id, partner: 'disconnected' };
        io.to(oldPartner.id).emit('match status', data);

        // reset partners
        socket.partner = null;
        oldPartner.partner = null;
      }

      // get a new partner
      socket.partner = findPartner(socket);

      // matched: send connected message
      if (socket.partner) {
        var data = { msg: 'you have been matched... start chatting!', socket: socket.id, partner: socket.partner.id }
        io.to(socket.partner.id).emit('match status', data);
        io.to(socket.id).emit('match status', data);

        // not matched: emit waiting message
      }
      console.log('unmatched is now', unmatched.map(person => person.id));
    });

    //////////////////
    /// DISCONNECT ///
    //////////////////

    socket.on('disconnect', function(reconnect) {
      var index;
      console.log('-----------------------');
      console.log(socket.id, 'disconnected from the server');
      var oldPartner = socket.partner;

      // if someone from the unmatched queue disconnected, remove them from the queue

      // 1. find the index
      unmatched.forEach(function(person, i) {
        if (person.id === socket.id) index = i;
      });

      // 2. delete them from queue
      if (typeof index === 'number') {
        unmatched.splice(index, 1);
      }

      // emit message to their partner that the person has left
      if (oldPartner && oldPartner.id !== 'bot') {
        io.to(oldPartner.id).emit('partner left', { msg: 'your partner left', partner: 'disconnected' });

        // remove partner objects from both sockets and push the old partner to unmatched array
        oldPartner.partner = null;
        unmatched.push(oldPartner);
        socket.partner = null;
      }
      // console.log('reconnecting', socket);
      // socket.io.reconnect();

    });

  });

};
