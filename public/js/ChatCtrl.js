app.controller('ChatCtrl', function($scope, ChatFactory, ScoreFactory) {
	
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

    if ($scope.partner === 'bot') {
      correct = (choiceForm.choice === $scope.partner) ? true : false;
    } else {
      correct = (choiceForm.choice !== 'bot') ? true : false;
    }

    // increase score appropriately
    if (correct) ScoreFactory.humans++;
    else ScoreFactory.bots++;

    ChatFactory.clearAllMessages()
    socket.emit('next');
    socket = io();
  };

  // posts whether the person is connected or waiting
  socket.on('match status', function(response) {
    $scope.partner = response.partner;
    console.log('partner is', $scope.partner)
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
