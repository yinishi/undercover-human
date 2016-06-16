var app = angular.module('botRoulette', ['ui.router']);

// app.controller('ChatCtrl', function($scope) {

// })

// app.factory('ChatFact', function($scope) {
	
// })

var socket = io();
$('form').submit(function() {
	msg = $('#m').val()
    socket.emit('chat message', msg);
    $('#messages').append($('<li>').text("you: " + msg));
    $('#m').val('');
    return false;
});

socket.on('match status', function(msg) {
    $('#messages').append($('<li class="automated-msg">').text(msg));
});

socket.on('reply', function(response) {
    $('#messages').append($('<li>').text("partner: " + response));
});

socket.on('partner left', function(response) {
    $('#messages').append($('<li class="automated-msg">').text(response));
});
