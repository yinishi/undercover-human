app.controller('ChatCtrl', function($scope, ChatFactory, ScoreFactory) {

  var socket = io();
  $scope.partner = false; // boolean: used for button disable only
  var partner = null; // stores the ID (bot, socket.id, or null)
  var scores = {human: 0, robot: 0};

  $scope.messages = ChatFactory.getMessages();

  //////////////////////////////
  /// SOCKET EVENT LISTENERS ///
  //////////////////////////////

  // posts whether the person is connected or waiting
  socket.on('match status', function(response) {
    partner = response.partner;

    // set the button disable variable upon match
    if (partner === 'disconnected')
      $scope.partner = 'disconnected';
    else 
      $scope.partner = Boolean(partner);

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
  socket.on('partner left', function(response) {
    partner = response.partner;

    // set the button disable variable upon match
    if (partner === 'disconnected')
      $scope.partner = 'disconnected';
    else 
      $scope.partner = Boolean(partner);

    $scope.$apply(function() {
      ChatFactory.postMessage(response.msg);
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
    var correct;
    $scope.partner = false; // set to false to disable send
    $scope.choiceForm = {};

    if (partner === 'bot') {
      correct = (choiceForm.choice === 'bot') ? true : false;
    } else if (partner !== 'bot') {
      correct = (choiceForm.choice === 'bot') ? false : true;
    }

    if (correct === true) 
      ScoreFactory.points++;
    else if (correct === false) 
      ScoreFactory.strikes++;

    ChatFactory.clearAllMessages();
    socket.emit('next');
  };
});
