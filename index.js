debugger;

var config = require('./config');
var express = require('express');
var app = express();
var port = process.env.PORT || 1337;
var mongodb = require('mongodb');
var uri = config.mongouri;

var users = [];
var games = [];

app.use(express.static(__dirname + '/public'));

app.set('views', __dirname + '/tpl');
app.set('view engine', 'jade');
app.engine('jade', require('jade').__express);

app.get('/', function(req, res){
	
	mongodb.MongoClient.connect(uri, function(err, db) {

		if(err) throw err;

		db
			.collection('team')
	  		.find({})
	  		.limit(10)
	  		.toArray(function(err, docs) {
	    		res.render('page', { 'socketEndpoint': req.headers.host, 'teams': docs });
			});
	});
});

var io = require('socket.io').listen(app.listen(port));

io.sockets.on('connection', function(socket) {
	socket.on('join-game', function(data) {
		var fullGameName = getFullGameName(data.teamName, data.gameName);
		var game = getOrAddGame(fullGameName);
		game.sockets.push({ userName: data.userName, userType: data.userType, socket: socket });
		var user = enterRoom(socket, game, data.userName, data.userType);
		
		if (data.userType === 'player') {
			playEmptyCardForNewUser(user);
		} else {
			game.observers.push(data.userName);
			alertNewObserverJoined(game, user);
		}

		var cards = getGameCardsForUser(user);
		socket.emit('game-joined', { success: true, userName: data.userName, userType: data.userType, observers: game.observers, cards: cards });
	});

	socket.on('play-card', function(data) {
  		var user = getUserBySocketId(socket.id);
  		playCardForUser(user, data.cardValue);
  	});

	socket.on('disconnect', function () {
		var user = getUserBySocketId(socket.id);
		if (user !== null) {
			var game = exitRoom(user);
			var sct = getSocket(game, user.userName);
			game.sockets.removeObj(sct);
			io.sockets.emit('user-left', { userName: user.userName });
		}
  	});  
});

function getSocket(game, userName) {
	for (var x in game.sockets) {
		if (game.sockets.hasOwnProperty(x)) {
			var socket = game.sockets[x];
			if (socket.userName === userName) {
				return socket;
			}
		}
	}
	return null;
}

function playEmptyCardForNewUser(user) {
	var game = getGame(user.fullGameName);
	var card = createCard(user.userName, null);
	game.cards.push(card);
	alertCardPlayed(game, user, card);
}

function playCardForUser(user, cardValue) {
	var game = getGame(user.fullGameName);
	var card;
	
	for (var x in game.cards) {
		if (game.cards.hasOwnProperty(x)) {
			var eCard = game.cards[x];
			if (eCard.userName === user.userName) {
				card = eCard;
				break;
			}
		}
	}

	if (card) {
		card.cardValue = cardValue;
	} else {
		card = createCardForUser(user, cardValue, true);
		game.cards.push(card);
	}

	alertCardPlayed(game, user, card);
}

function alertNewObserverJoined(game, user) {
	for (var x in game.sockets) {
		if (game.sockets.hasOwnProperty(x)) {
			game.sockets[x].socket.emit('observer-joined', { userName: user.userName });
		}
	}
}

function alertCardPlayed(game, user, card) {
	var sCard = createCard(user.userName, '?');
	for (var x in game.sockets) {
		if (game.sockets.hasOwnProperty(x)) {
			var socket = game.sockets[x];
			if (socket.userName === user.userName || card.cardValue === null || socket.userType !== 'player') {
				socket.socket.emit('card-played', card);
			} else {
				socket.socket.emit('card-played', sCard);
			}
		}
	}
}

function getUserBySocketId(socketId) {
	for (var x in users) {
		if (users.hasOwnProperty(x)) {
			var user = users[x];
			if (user.id === socketId) {
				return user;
			}
		}
	}
	return null;
}

function enterRoom(socket, game, userName, userType) {
	var user = { id: socket.id, socket: socket, userName: userName, fullGameName: game.fullGameName, userType: userType };
	if (userType === "player") {
		socket.join(game.playerRoomName);
	} else {
		socket.join(game.observerRoomName);
	}
	users.push(user);
	return user;
}

function exitRoom(user) {
	var game = getGame(user.fullGameName);
	if (game) {
		for (var x in game.cards) {
			if (game.cards.hasOwnProperty(x)) {
				var card = game.cards[x];
				if (card) {
					game.cards.removeObj(card);
					break;
				}				
			}			
		}
	}

	users.removeObj(user);

	return game;
}

function getFullGameName(teamName, gameName) {
	return teamName + "_" + gameName;
}

function getGame(fullGameName) {
	for (var x in games) {
		if (games.hasOwnProperty(x)) {
			var game = games[x];
			if (game.fullGameName === fullGameName) {
				return game;
			}
		}
	}

	return null;
}

function getGameCardsForUser(user) {
	var game = getGame(user.fullGameName);
	if (user.userType === 'player') {
		var pCards = [];
		for (var x in game.cards) {
			if (game.cards.hasOwnProperty(x)) {
				var card = game.cards[x];
				if (card.userName === user.userName) {
					pCards.push(card);	
				} else {
					pCards.push(createCard(card.userName, '?'));
				}				
			}			
		}
		return pCards;
	} else {
		return game.cards;
	}
}

function createCardForUser(user, cardValue, alwaysShowValue) {
	if (alwaysShowValue || user.userType !== 'player') {
		return createCard(user.userName, cardValue);
	}

	return createCard(user.userName, '?');
}

function createCard(userName, cardValue) {
	return { userName: userName, cardValue: cardValue };
}

function getOrAddGame(fullGameName) {
	var game = getGame(fullGameName);

	if (!game) {
		game = { 
			fullGameName: fullGameName, 			
			playerRoomName: fullGameName + "-p",
			observerRoomName: fullGameName + "-o",
			cards: [],
			observers: [],
			sockets: []
		}
		games.push(game);
	}

	return game;
}

Array.prototype.removeObj = function(obj) {
	var o = Object(this);
	var index = o.indexOf(obj);
	if (index >= 0) {
		o.splice(index, 1);
	}
};

console.log('listening on port ' + port);