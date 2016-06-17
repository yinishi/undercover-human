app.controller('ChatCtrl', function($scope, ChatFactory, ScoreFactory) {
	$scope.choiceForm = {$invalid: true}

  var socket = io();
  $scope.partner = null;
  var scores = {human: 0, robot: 0};

  $scope.messages = ChatFactory.getMessages();

  // tied to the submit button in the chat bar
  $scope.postMessage = function() {
    ChatFactory.postMessage('you: ' + $scope.input);
    socket.emit('chat message', $scope.input);
    $scope.input = "";
  };

  $scope.next = function(choiceForm) {
    var correct;

    $scope.choiceForm = {}
    if ($scope.partner === 'bot') {
      correct = (choiceForm.choice === $scope.partner) ? 'correct' : 'incorrect';
    } else if ($scope.partner === 'human'){
      correct = (choiceForm.choice !== 'bot') ? 'correct' : 'incorrect';
    } else if ($scope.partner === null) {
      correct = 'na'
    }

    // increase score appropriately
    // if (correct === 'correct') ScoreFactory.humans++;
    // else ScoreFactory.bots++;

    ChatFactory.clearAllMessages();
    socket.emit('next');
  };

  // posts whether the person is connected or waiting
  socket.on('match status', function(response) {
    $scope.partner = response.partner;
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

  // posts a message when your partner leaves the chat
  socket.on('partner left', function(msg) {
    $scope.$apply(function() {
      ChatFactory.postMessage(msg);
    });
  });
});
