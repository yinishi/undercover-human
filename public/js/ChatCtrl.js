app.controller('ChatCtrl', function($scope, ChatFactory, ScoreFactory) {

  var socket = io();
  $scope.partner = false; // boolean: used for button disable only
  var partner = null; // stores the ID (bot, socket.id, or null)
  var scores = { human: 0, robot: 0 };

  $scope.messages = ChatFactory.getMessages();

  //////////////////////////////
  /// SOCKET EVENT LISTENERS ///
  //////////////////////////////

  // set person's match status: connected, waiting, or partner left
  socket.on('match status', function(response) {
    partner = response.partner;

    // set the button disable variable upon match
    setPartnerBool(partner);

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
    $scope.partner = false; // set to false to disable send
    $scope.choiceForm = {};

    if (partner === 'bot') {
      $scope.correct = (choiceForm.choice === 'bot') ? true : false;
    } else if (partner !== 'bot') {
      $scope.correct = (choiceForm.choice === 'bot') ? false : true;
    }

    if ($scope.correct)
      ScoreFactory.points++;
    else if (!$scope.correct)
      ScoreFactory.strikes++;

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
    socket.emit('next');
  };

  ////////////////////////
  /// HELPER FUNCTIONS ///
  ////////////////////////

  function setPartnerBool(partner) {
    // set the button disable variable upon match
    if (partner === 'disconnected')
      $scope.partner = 'disconnected';
    else
      $scope.partner = Boolean(partner);
  }

});
