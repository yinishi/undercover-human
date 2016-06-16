var socket = io();
$('form').submit(function() {
    socket.emit('chat message', $('#m').val());
    $('#messages').append($('<li>').text("user1: " + $('#m').val()));
    $('#m').val('');
    return false;
});
socket.on('chat message', function(msg) {
    $('#messages').append($('<li>').text("user2: " + msg));
});
