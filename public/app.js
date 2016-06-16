var socket = io();
$('form').submit(function() {
	msg = $('#m').val()
    socket.emit('chat message', msg);
    $('#messages').append($('<li>').text("you: " + msg));
    $('#m').val('');
    return false;
});

socket.on('reply', function(response) {
    $('#messages').append($('<li>').text("partner: " + response));
});
