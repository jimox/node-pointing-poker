var config = require('./config')
var express = require('express');
var app = express();
var port = process.env.PORT || 1337;
var mongodb = require('mongodb');
var uri = config.mongouri;

var games = [];
var users = [];

app.use(express.static(__dirname + '/public'));

app.set('views', __dirname + '/tpl');
app.set('view engine', 'jade');
app.engine('jade', require('jade').__express);

app.get('/', function(req, res){
	mongodb.MongoClient.connect(uri, function(err, db) {
		if(err) throw err;

		var collection = db
	  		.collection('teams')
	  		.find({})
	  		.limit(10)
	  		.toArray(function(err, docs) {
	    		res.render('page', { 'teams': docs });
			});
	});
});

var io = require('socket.io').listen(app.listen(port));

io.sockets.on('connection', function(socket) {
	socket.on('join-game', function(data) {
		var fullGameName = getFullGameName(data.teamName, data.gameName);
		var game = getGame(fullGameName);
		enterRoom(socket, game, data.userName, data.userType);
		/*
		if (data.userType === "player") {
			io.to(game.playerRoomName).emit('message', { message: data.userName + " joined your room." });
		} else {
			io.to(game.observerRoomName).emit('message', { message: data.userName + " joined your room." });
		}
		*/
		socket.emit('game-joined', { success: true, userType: data.userType });
	});

	socket.on('disconnect', function () {
		var user = getUserBySocketId(socket.id);
		if (user !== null) io.sockets.emit('message', { message: user.userName + " left room." });
  	});
});

function getUserBySocketId(socketId) {
	for (var x in users) {
		var user = users[x];
		if (user.id === socketId) {
			return user;
		}
	}
	return null;
}

function enterRoom(socket, game, userName, userType) {
	if (userType === "player") {
		game.players.push(userName);
		users.push({ id: socket.id, userName: userName, gameName: game.fullGameName });
		socket.join(game.playerRoomName);
	} else {
		game.observers.push(userName);
		users.push({ id: socket.id, userName: userName, gameName: game.fullGameName });
		socket.join(game.observerRoomName);
	}
}

function getFullGameName(teamName, gameName) {
	return teamName + "_" + gameName;
}

function getGame(fullGameName) {
	for (var x in games) {
		var game = games[x];
		if (game.name === fullGameName) {
			return game;
		}
	}

	var game = {
		name: fullGameName,
		players: [],
		playerRoomName: fullGameName + "-p",
		observers: [],
		observerRoomName: fullGameName + "-o"
	};

	games.push(game);

	return game;
}

console.log('listening on port ' + port);