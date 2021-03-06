app.controller('ChatCtrl', function($scope, ChatFactory, ScoreFactory) {

  var socket = io();

  $scope.waitingForPartner = false; // toggles send button
  $scope.hasPartner = false; // toggles submit button

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

    // set button disable vars
    if (matchData.hasOwnProperty('partner')) {
      pair.partner = matchData.partner;
      $scope.hasPartner = !!pair.partner;
    }

    $scope.waitingForPartner = matchData.waitingForPartner;

    // re-enable this to see all the vars
    // console.log('self:', pair.self, ', partner:', pair.partner, ', $scope.waitingForPartner:', $scope.waitingForPartner, 'hasPartner:', $scope.hasPartner);

    if (matchData.hasOwnProperty('msg')) {
      // console.log('msg is', matchData.msg);
      $scope.$apply(function() {
        ChatFactory.postMessage(matchData.msg);
      });
    }

  });

  // posts the matchData from the person you're chatting with
  socket.on('reply', function(msg) {
    $scope.$apply(function() {
      ChatFactory.postMessage("partner: " + msg);
    });
  });

  // emitted from 'next' on server side
  socket.on('update score', function(fooledData) {
      // increase your "fooled your partner" score if the partner was fooled
    if (fooledData.partnerWasFooled) {
      ScoreFactory.scores.fooledPartner++;
      ScoreFactory.scores.totalScore += 5;
    }
  });

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
    if ($scope.correct) {
      ScoreFactory.scores.correctGuesses++;
      ScoreFactory.scores.totalScore += 1;
      $scope.message = (choiceForm.choice === 'bot') ?
        'Correct! Your partner was a bot.' :
        'Correct! Your partner was a human.';
    } else if (!$scope.correct) {
      ScoreFactory.scores.fooledByPartner++;
      ScoreFactory.scores.totalScore -= 3;
      $scope.message = (choiceForm.choice === 'bot') ?
        'Wrong! Your partner was a human.' :
        'Wrong! Your partner was a bot.';

    }

    ChatFactory.clearAllMessages();

    // EMIT NEXT EVENT
    // guess data is for a human partner (tells them whether or not they fooled you)
    var guessData = {};
    guessData.partnerWasFooled = !$scope.correct;

    socket.emit('next', guessData);
  };

});
