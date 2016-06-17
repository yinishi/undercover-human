var socketio = require('socket.io');
var bot = require('./bot').bot;

var unmatched = [];

function coinFlip() {
  return Math.floor(Math.random() * 2 + 1);
}

function findPartner(mySocket) {

  // 50% chance of getting matched with a bot
  if (coinFlip() % 2) {

    // make sure to delete self from match queue if connected with a bot
    // // 1. find the index
    // var index
    //   unmatched.forEach(function(person, i) {
    //     if (person.id === mySocket.id) index = i;
    //   });

    //   // 2. delete them from queue
    //   console.log('searched for person in queue and they were found at', index)
    //   if (typeof index === 'number') {
    //     unmatched.splice(index, 1);
    //   }

    return { id: 'bot' };

    // there are unmatched people
  } else if (unmatched.length > 0) {
    // if (unmatched.length > 0) {

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
    console.log(mySocket.id);
    console.log('waiting for a partner');
  }
}

module.exports = function(server) {
  var io = socketio(server);

  io.on('connection', function(socket) {
    console.log('-----------------');
    console.log(socket.id, 'connected');
    console.log('unmatched users after joining', unmatched.map(person => person.id));

    // upon connection, either get matched with a partner or get added to the unmatched queue
    socket.partner = findPartner(socket);
    var partner = socket.partner || 'n/a';
    console.log('found a partner for', socket.id, ':', partner.id);
    console.log('unmatched users after match', unmatched.map(person => person.id));

    // matched: send connected message
    if (socket.partner) {
      var data = { msg: 'you have been matched... start talking!', socket: socket.id, partner: socket.partner.id }
      io.to(socket.partner.id).emit('match status', data);
      io.to(socket.id).emit('match status', data);

      // not matched: emit waiting message
    } else {
      io.to(socket.id).emit('match status', { msg: 'waiting for partner...' });
    }

    // upon receiving the first message...
    socket.on('chat message', function(msg) {
      // if your partner is a bot...
      if (socket.partner.id === 'bot') {
        console.log(socket.id, 'is chatting with bot');
        // io.to() emits the response to the socket that sent the message only
        io.to(socket.id).emit('reply', bot.reply(socket.id, msg));

        // if your partner is human...
      } else {
        io.to(socket.partner.id).emit('reply', msg);
      }
    });


    ///////////////////
    /// NEXT BUTTON ///
    ///////////////////

    socket.on('next', function() {

      if (socket.partner) {
        console.log('--------------------');
        console.log(socket.id, 'disconnected from their partner,', socket.partner.id);
        var oldPartner = socket.partner;

        // emit waiting message
        io.to(socket.id).emit('match status', { msg: 'waiting for partner...' });

        // tell your old partner that you left
        var data = { msg: 'your partner left :( please judge them before moving on >', socket: socket.id, partner: '' };
        io.to(oldPartner.id).emit('match status', data);

        // reset partners
        socket.partner = null;
        oldPartner.partner = null;
        console.log('partner should now be null', socket.partner);
        console.log('checking to make sure old partner still exists as an obj', oldPartner.id);
      }

      // get a new partner
      socket.partner = findPartner(socket);

      // matched: send connected message
      if (socket.partner) {
        var data = { msg: 'you have been rematched... start talking!', socket: socket.id, partner: socket.partner.id }
        io.to(socket.partner.id).emit('match status', data);
        io.to(socket.id).emit('match status', data);

        // not matched: emit waiting message
      } else {
        io.to(socket.id).emit('match status', { msg: 'waiting for a new partner...' });
      }
      console.log('unmatched is now', unmatched.map(person => person.id));
    });


    // if someone leaves the server
    socket.on('disconnect', function(reconnect) {
      var index;
      console.log('-----------------------');
      console.log(socket.id, 'disconnected from the server');

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
      if (socket.partner && socket.partner.id !== 'bot') {
        io.to(socket.partner.id).emit('partner left', 'your partner left');

        // remove partner objects from both sockets and push the old partner to unmatched array
        var oldPartner = socket.partner;
        oldPartner.partner = null;
        unmatched.push(oldPartner);
        socket.partner = null;
      }
      // console.log('reconnecting', socket);
      // socket.io.reconnect();

    });

  });

};
