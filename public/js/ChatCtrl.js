app.controller('ChatCtrl', function($scope, ChatFactory, ScoreFactory) {

  var socket = io();
  $scope.waitingForPartner = false;
  $scope.hasPartner = false;
  // $scope.partner = false; // boolean: used for button disable only
  var pair = { // stores info about chat session
    self: null,
    partner: null,
    waitingForPartner: true
  }; 

  $scope.messages = ChatFactory.getMessages();

  //////////////////////////////
  /// SOCKET EVENT LISTENERS ///
  //////////////////////////////

  // set person's match status: connected, waiting, or partner left
  socket.on('match status', function(matchData) {
    pair.self = matchData.self;
    pair.partner = matchData.partner;
    $scope.waitingForPartner = matchData.waitingForPartner;

    // if (matchData.hasOwnProperty('formerPartner') ) {
    //   formerPartner = matchData.formerPartner;
    // }

    // set the button disable variable upon match
    $scope.hasPartner = !!pair.partner;

    console.log('self:', pair.self, ', partner:', pair.partner, ', $scope.waitingForPartner:', $scope.waitingForPartner, 'hasPartner:', $scope.hasPartner);


    if (matchData.hasOwnProperty('partnerGuessedCorrectly')) {
      console.log('your partner was a human and guessed!', matchData.partnerGuessedCorrectly);
      ScoreFactory.scores.fooledPartner++;
    }

    $scope.$apply(function() {
      ChatFactory.postMessage(matchData.msg);
    });
  });

  // posts the matchData from the person you're chatting with
  socket.on('reply', function(msg) {
    $scope.$apply(function() {
      ChatFactory.postMessage("partner: " + msg);
    });
  });

  // socket.on('update score', function(partnerGuessedCorrectly) {
  //   if (!partnerGuessedCorrectly) ScoreFactory.scores.fooledPartner++;
  // });

  ////////////////////////
  /// BUTTON FUNCTIONS ///
  ////////////////////////

  // tied to the submit button in the chat bar
  $scope.postMessage = function() {
    ChatFactory.postMessage('you: ' + $scope.input);
    socket.emit('chat message', $scope.input);
    $scope.input = "";
  };

  // tied to the "Submit and connect with new partner" button
  $scope.next = function(choiceForm) {
    $scope.waitingForPartner = false; // set to false to disable send
    $scope.choiceForm = {};

    if (pair.partner === 'bot') {
      $scope.correct = (choiceForm.choice === 'bot') ? true : false;
    } else if (pair.partner !== 'bot') {
      $scope.correct = (choiceForm.choice === 'bot') ? false : true;
    }

    // calculate points
    if ($scope.correct)
      ScoreFactory.scores.correctGuesses++;
    else if (!$scope.correct)
      ScoreFactory.scores.fooledByPartner++;

    // generate notification
    if ($scope.correct) {
      $scope.message = (choiceForm.choice === 'bot') ?
        'Correct! Your partner was a bot.' :
        'Correct! Your partner was a human.';
    } else {
      $scope.message = (choiceForm.choice === 'bot') ?
        'Wrong! Your partner was a human.' :
        'Wrong! Your partner was a bot.';
    }

    ChatFactory.clearAllMessages();

    // EMIT NEXT EVENT
    // emitting is only necessary if your partner was a human
    var guessData = {};
    if (pair.partner !== 'bot') {
      if ($scope.correct)
        guessData.partnerGuessedCorrectly = true;
      else
        guessData.partnerGuessedCorrectly = false;

      // if (formerPartner) {
      //   guessData.formerPartner = formerPartner
      //   socket.emit('notify formerPartner', guessData)
      // }

      socket.emit('next', guessData);
    } else {
      socket.emit('next');
    }

  };

  ////////////////////////
  /// HELPER FUNCTIONS ///
  ////////////////////////

  // function setPartnerBool(partner) {
  //     $scope.partner = Boolean(pair.partner);
  // }

});
