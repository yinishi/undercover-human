var socketio = require('socket.io');
var bot = require('./bot').bot;

var unmatched = [];
var timeout = Math.random() * 6000 + 1000;

// DATA VARS
var gotMatchedMsg = 'you have been matched... start chatting!';
var partnerLeftMsg = 'your partner left. please assess them before moving on.';
var waitingMsg = 'waiting for partner...';


////////////////////////
/// HELPER FUNCTIONS ///
////////////////////////

function coinFlip() {
  return Math.floor(Math.random() * 2 + 1);
}

function findPartner(socket) {

  // 50% chance of getting matched with a bot
  if (coinFlip() % 2) {
    return { 
      id: 'bot', 
      waitingForPartner: false 
    };

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

    // not matched: emit waiting message
    io.to(socket.id).emit('match status', {
      msg: waitingMsg,
      self: socket.id,
      partner: null,
      waitingForPartner: true
    });

    setTimeout(sendMatch, timeout);
    // matched: send connected message

    function sendMatch() {
      // upon connection, either get matched with a partner or get added to the unmatched queue
      socket.partner = findPartner(socket);

      console.log('person connected:', socket.id, 'partner: ', socket.partner || 'none');
      console.log('unmatched users after match', unmatched.map(person => person.id));


      // got matched with a partner
      if (socket.partner) {

        // emit match status to self
        io.to(socket.id).emit('match status', {
          msg: gotMatchedMsg,
          self: socket.id,
          partner: socket.partner.id,
          waitingForPartner: false
        });

        // emit match status to partner
        io.to(socket.partner.id).emit('match status', {
          msg: gotMatchedMsg,
          self: socket.partner.id,
          partner: socket.id,
          waitingForPartner: false
        });

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

        // set a delay so the bot does not respond immediately
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
      console.log('--------------------');

      // emit waiting message to self
      io.to(socket.id).emit('match status', {
        msg: waitingMsg,
        self: socket.id,
        partner: null,
        waitingForPartner: true
      });

      // if partner exists and partner is not a bot
      if (socket.partner && socket.partner.id !== 'bot') {
        var oldPartner = socket.partner;
        console.log(socket.id, 'disconnected from their partner,', oldPartner.id);

        var dataToPartner = {
          msg: partnerLeftMsg,
          self: oldPartner.id,
          partner: socket.id,
          waitingForPartner: true
        }

        if (guessData) {
          dataToPartner.partnerGuessedCorrectly = guessData.partnerGuessedCorrectly;
        }

        // tell your old partner that you left
        io.to(oldPartner.id).emit('match status', dataToPartner);

        // reset partners
        socket.partner = null;
        oldPartner.partner = null;
      }

      // get a new partner
      socket.partner = findPartner(socket);


      console.log('person connected:', socket.id);
      console.log('unmatched users after match', unmatched.map(person => person.id));

      // partner exists
      if (socket.partner) {

        // emit match status to self
        io.to(socket.id).emit('match status', {
          msg: gotMatchedMsg,
          self: socket.id,
          partner: socket.partner.id,
          waitingForPartner: false
        });

        // emit match status to partner
        io.to(socket.partner.id).emit('match status', {
          msg: gotMatchedMsg,
          self: socket.partner.id,
          partner: socket.id,
          waitingForPartner: false
        });
      }


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

      // if someone from the queue disconnects, remove them from the queue
      removeSelfFromQueue(socket.id);

      // emit message to their partner that the person has left
      if (socket.partner && socket.partner.id !== 'bot') {
        var oldPartner = socket.partner;

        // tell your old partner that you left
        io.to(oldPartner.id).emit('match status', {
          msg: partnerLeftMsg,
          self: oldPartner.id,
          partner: socket.id,
          waitingForPartner: false
        });

        // remove partner objects from both sockets
        console.log('abandoned partner is', oldPartner.id);
        oldPartner.partner = null;
        socket.partner = null;
      }

    });

  });

};
