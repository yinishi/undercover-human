var socketio = require('socket.io');
var bot = require('./bot').bot;


var unmatched = [];
var timeout = Math.random() * 6000 + 1000;


////////////////////////
/// HELPER FUNCTIONS ///
////////////////////////

function coinFlip() {
  return Math.floor(Math.random() * 2 + 1);
}

function findPartner(socket) {

  // 50% chance of getting matched with a bot
  if (coinFlip() % 2) {
    return { id: 'bot' };

    // there are unmatched people
  } else if (unmatched.length > 0) {

    // make sure you don't get paired with yourself
    // if (unmatched[0].id === socket.id) {
    //   return unmatched.splice(1, 1);
    // } else {

    var partner = unmatched.shift();
    partner.partner = socket;
    return partner;

    // there are no unmatched people, get added to the queue and wait. THIS IS THE ONLY PLACE IN THE ENTIRE PROGRAM WHERE SOMEONE EVER SHOULD GET PUSHED TO THE QUEUE.
  } else if (unmatched.length < 1) {
    unmatched.push(socket);
    console.log(socket.id);
    console.log('waiting for a partner');
  }
}

// this function should be only used on people who are CURRENTLY waiting in the queue
function removeSelfFromQueue(id) {
  console.log('queue length is', unmatched.length);
  // 1. find the index
  unmatched.forEach(function(person, i) {
    if (person.id === id) index = i;
  });

  // 2. delete them from queue
  if (typeof index === 'number') {
    unmatched.splice(index, 1);
    console.log('removed from queue', unmatched.length);
  } else console.log('not in queue, not removed', unmatched.length);
}

//////////////////////////
/// SOCKETS START HERE ///
//////////////////////////

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
      var partner = socket.partner || 'none'
      console.log('person connected:', socket.id, 'partner: ', partner);
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

    socket.on('next', function(guessData) {
      // first, emit waiting message
      console.log('--------------------');
      io.to(socket.id).emit('match status', { msg: 'waiting for a new partner...' });
      console.log('unmatched is now', unmatched.map(person => person.id));

      // if the person who disconnected has a partner
      if (socket.partner && socket.partner !== 'disconnected') {
        var oldPartner = socket.partner;

        console.log(socket.id, 'disconnected from their partner,', socket.partner.id);

        // tell your old partner that you left
        var data = { msg: 'your partner left. please assess them before moving on.', formerPartner: socket.id, partner: 'disconnected' };

        if (guessData) {
          data.partnerGuessedCorrectly = guessData.partnerGuessedCorrectly;
        }

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

    // socket.on('notify formerPartner', function(guessData) {
    //   io.to(guessData.formerPartner).emit('update score', guessData.partnerGuessedCorrectly);
    // })

    //////////////////
    /// DISCONNECT ///
    //////////////////

    socket.on('disconnect', function() {
      var index;
      console.log('-----------------------');
      console.log(socket.id, 'disconnected from the server');
      var oldPartner = socket.partner;

      // if someone from the queue disconnects, remove them from the queue
      removeSelfFromQueue(socket.id);

      // emit message to their partner that the person has left
      if (oldPartner && oldPartner.id !== 'bot') {
        
        // tell your old partner that you left
        data = { msg: 'your partner left. please assess them before moving on.', socket: oldPartner.id, partner: 'disconnected' };
        io.to(oldPartner.id).emit('match status', data);

        // remove partner objects from both sockets and push the old partner to unmatched array
        oldPartner.partner = null;
        console.log('abandoned partner is', oldPartner.id);
        socket.partner = null;
      }

    });

  });

};
