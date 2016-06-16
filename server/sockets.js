var socketio = require('socket.io');
var bot = require('./bot').bot;

module.exports = function(server) {
  var io = socketio(server);

  var unmatched = [];

  function coinFlip() {
    return Math.floor(Math.random() * 2 + 1);
  }

  function findPartner(mySocket) {

    // 50% chance of getting matched with a bot
    if (coinFlip() % 2) {
      return { id: 'bot' };

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
    console.log('unmatched users after joining', unmatched.map(person => person.id));

    socket.partner = findPartner(socket);
    var partner = socket.partner || 'n/a';
    console.log('found a partner for', socket.id, ':', partner.id);
    console.log('unmatched users after match', unmatched.map(person => person.id));

    if (socket.partner) {
      io.to(socket.partner.id).emit('match status', 'you have been matched... start talking!');
      io.to(socket.id).emit('match status', 'you have been matched... start talking!');
    } else {
      io.to(socket.id).emit('match status', 'waiting for partner');
    }

    socket.on('chat message', function(msg) {

      // if your partner is a bot...
      if (socket.partner.id === 'bot') {
        console.log('chatting with bot', socket.id);
          // io.to() emits the response to the socket that sent the message only
        io.to(socket.id).emit('reply', bot.reply(socket.id, msg));

        // if your partner is human...
      } else {
        io.to(socket.partner.id).emit('reply', msg);
      }

    });

    socket.on('disconnect', function() {
      var index;
      console.log('-----------------------');
      console.log(socket.id, 'disconnected from the server');

      // if someone from the unmatched queue disconnected, remove them from the queue

      // 1. find the index
      unmatched.forEach(function(person, i) {
        if (person.id === socket.id) {
          console.log('theres a match!', index, i);
          index = i
        }
      })

      // 2. delete them from queue
      if (typeof index === 'number') {
        unmatched.splice(index, 1)
      }

      // emit message to their partner that the person has left
      if (socket.partner && socket.partner.id !== 'bot') {
        io.to(socket.partner.id).emit('partner left', 'your partner left')

        // remove partner objects from both sockets and push the old partner to unmatched array
        var olderPartner = socket.partner;
        olderPartner.partner = null;
        unmatched.push(olderPartner);
        socket.partner = null;
      }


    });

  });

}
