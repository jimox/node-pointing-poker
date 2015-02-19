var sTeam,
	sGame,
	socket;

var teamsTpl,
	gamesTpl,
	titleTpl,
	cardsTpl,
	handTpl,
	observerTpl;

$(function() {
	teamsTpl = Handlebars.compile($("#teams-tpl").html());
	gamesTpl = Handlebars.compile($("#games-tpl").html());
	titleTpl = Handlebars.compile($("#title-tpl").html());
	cardsTpl = Handlebars.compile($("#cards-tpl").html());
	handTpl = Handlebars.compile($("#hand-tpl").html());
	observerTpl = Handlebars.compile($("#observer-tpl").html());

	socket = io.connect('//' + npp.socketEndpoint);

	socket.on('message', function(data) {
		console.log(data.message);
	});

	socket.on('game-joined', function(data) {
		if (data.success) {
			$("#sign-in").hide();
			$("#game-container").show();
			if (data.userType === 'player') {
				setupCards();
			}
			if (data.cards.length > 0) {
				manageCardList(data.cards);
			}
		}
	});

	socket.on('observer-joined', function(data) {
		addObserver(data);
	});	

	socket.on('card-played', function (card) {
		manageHand(card);
	});

	socket.on('user-left', function (data) {
		$('#results').find('div[data-user-hand="' + data.userName + '"]').remove();
	});

	// Bind the teams
	$("#teams-list").html(teamsTpl(data));

	$("#teams-list").on("click", "a", function() {
		var ctl = $(this);
		var teamName = ctl.attr("data-team-name");		
		for (var x in data.teams) {
			var t = data.teams[x];
			if (t.name === teamName) {
				sTeam = t;
				break;
			}
		}

		$("#teams-container").hide();
		$("#games-list").html(gamesTpl(sTeam));
		$("#games-container").show();

		return false;
	});

	$("#games-list").on("click", "a", function() {
		var ctl = $(this);
		var gameName = ctl.attr("data-game-name");		
		for (var x in sTeam.games) {
			var g = sTeam.games[x];
			if (g.name === gameName) {
				sGame = g;
				break;
			}
		}

		$("#games-container").hide();
		$("#sign-in").show();
		$("#title").html(titleTpl({ 'team': sTeam, 'game': sGame })).show();

		return false;
	});

	$("a#join-as-player").click(function() {
		var ctl = $('#user-name');
		var name = $.trim(ctl.val());
		if (name.length <= 0) {
			ctl.parent().addClass('error');
			return false;
		}
		joinGame("player", name);
		return false;
	});

	$("a#join-as-observer").click(function() {
		var ctl = $('#user-name');
		var name = $.trim(ctl.val());
		if (name.length <= 0) {
			ctl.parent().addClass('error');
			return false;
		}
		joinGame("observer", name);
		return false;
	});

	$("#card-container").on("click", "a", function() {
		var ctl = $(this);
		socket.emit('play-card', { cardValue: ctl.attr('data-card-value') });
		return false;
	});
});

function addObserver(data) {
	var observers = $('#observers');
	observers.append(observerTpl(data));
	$('#observer-container').show();
}

function joinGame(userType, name) {
	var packet = { 
			userName: name,
			userType: userType,
			teamName: sTeam.name,
			gameName: sGame.name
		};
	socket.emit('join-game', packet);
}

function setupCards() {	
	$("#card-container").html(cardsTpl(sGame));
	var width = Math.max.apply(Math, $('#card-container a').map(function(){ return $(this).width(); }).get());
	$('#card-container a').width(width);
}

function manageCardList(cards) {
	for (var x in cards) {
		if (cards.hasOwnProperty(x)) {
			var card = cards[x];
			manageHand(card);
		}
	}
}

function manageHand(card) {
	var res = $('#results');
	var hand = res.find('div[data-user-hand="' + card.userName + '"]');
	if (hand.length > 0) {
		hand.find('.val').html(card.cardValue);
	} else {
		res.append(getHand(card));
		hand = res.find('div[data-user-hand="' + card.userName + '"]');
	}
	hand.higlight();
}

function getHand(card) {	
	return handTpl(card);
}