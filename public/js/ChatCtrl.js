app.controller('ChatCtrl', function($scope, ChatFactory, ScoreFactory) {

  var socket = io();
  $scope.matched = false; // boolean: used for button disable only
  var pair = { // stores info about chat session
    self: null,
    partner: null,
  }; 

  var scores = { human: 0, robot: 0 };
  var formerPartner;
  $scope.messages = ChatFactory.getMessages();

  //////////////////////////////
  /// SOCKET EVENT LISTENERS ///
  //////////////////////////////

  // set person's match status: connected, waiting, or partner left
  socket.on('match status', function(response) {
    partner = response.partner;

    // if (response.hasOwnProperty('formerPartner') ) {
    //   formerPartner = response.formerPartner;
    // }

    console.log('response in match status is', response);

    // set the button disable variable upon match
    setPartnerBool(partner);

    if (response.hasOwnProperty('partnerGuessedCorrectly')) {
      console.log('your partner was a human and guessed!', response.partnerGuessedCorrectly);
      ScoreFactory.scores.fooledPartner++;
    }

    $scope.$apply(function() {
      ChatFactory.postMessage(response.msg);
    });
  });

  // posts the response from the person you're chatting with
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
    $scope.matched = false; // set to false to disable send
    $scope.choiceForm = {};

    if (partner === 'bot') {
      $scope.correct = (choiceForm.choice === 'bot') ? true : false;
    } else if (partner !== 'bot') {
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
    if (partner !== 'bot') {
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

  function setPartnerBool(partner) {
    // set the button disable variable upon match
    if (partner === 'disconnected')
      $scope.matched = 'disconnected';
    else
      $scope.matched = Boolean(partner);
  }

});
