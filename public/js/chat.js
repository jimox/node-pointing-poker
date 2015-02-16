$(function() {
	var socket = io.connect('//localhost:1337');

	socket.on('message', function(data) {
		alert(data.message);
	});

	$("input[type='button']").click(function() {
		var packet = { name: $('#user-name').val() };
		socket.emit('send-name', packet);
	});
});