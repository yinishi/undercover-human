var app = angular.module('bot', ['ui.router']);

app.controller('ChatCtrl', function($scope, ChatFactory) {
	
  var socket = io();

  $scope.messages = ChatFactory.getMessages();

  // tied to the submit button in the chat bar
  $scope.postMessage = function() {
    ChatFactory.postMessage('you: ' + $scope.input);
    socket.emit('chat message', $scope.input);
    $scope.input = "";
  };

  // posts whether the person is connected or waiting
  socket.on('match status', function(msg) {
    $scope.$apply(function() {
      ChatFactory.postMessage(msg);
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

app.factory('ChatFactory', function() {

  var messageCache = [];

  return {
    getMessages: function() {
      return messageCache;
    },
    postMessage: function(message) {
      messageCache.push(message);
    },
    clearAllMessages: function() {
      messageCache = [];
    }
  };
});
