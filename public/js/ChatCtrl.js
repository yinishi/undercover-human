app.controller('ChatCtrl', function($scope, ChatFactory, ScoreFactory) {

  var socket = io();
  $scope.partner = false; // scope variable is a boolean
  var partner = null // partner variable stores the actual ID
  var scores = {human: 0, robot: 0};

  console.log('$scope.partner', $scope.partner, 'partner', partner);
  $scope.messages = ChatFactory.getMessages();

  // tied to the submit button in the chat bar
  $scope.postMessage = function() {
    ChatFactory.postMessage('you: ' + $scope.input);
    socket.emit('chat message', $scope.input);
    $scope.input = "";
  };

  $scope.next = function(choiceForm) {
    var youWin;
    var partnerWins;

    $scope.partner = false;

    $scope.choiceForm = {};
    if (partner === 'bot') {
      youWin = (choiceForm.choice === partner) ? true : false;
    } else if ($scope.partner === 'human'){
      youWin = (choiceForm.choice !== 'bot') ? true : false;
    }

    console.log('do you win?', youWin);
    console.log('does your partner win?', partnerWins);

    // increase score appropriately
    // if (correct === 'correct') ScoreFactory.humans++;
    // else ScoreFactory.bots++;`

    ChatFactory.clearAllMessages();
    socket.emit('next');
  };

  // posts whether the person is connected or waiting
  socket.on('match status', function(response) {
    partner = response.partner;
    $scope.partner = Boolean(partner);
    console.log('scope.partner is', $scope.partner, 'partner is', partner)
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
    $scope.partner = false;
    $scope.$apply(function() {
      ChatFactory.postMessage(msg);
    });
  });
});
