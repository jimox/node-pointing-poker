var sTeam,
	sGame,
	socket;

$(function() {
	socket = io.connect('//localhost:1337');

	socket.on('message', function(data) {
		console.log(data.message);
	});

	socket.on('game-joined', function(data) {
		if (data.success) {
			$("#sign-in").hide();
			$("#game-container").show();
			if (data.userType === 'player') setupCards();
		}
	});

	var teamsTpl = Handlebars.compile($("#teams-tpl").html());
	var gamesTpl = Handlebars.compile($("#games-tpl").html());
	var titleTpl = Handlebars.compile($("#title-tpl").html());

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
		return false;
	});
});

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
	var cardsTpl = Handlebars.compile($("#cards-tpl").html());
	$("#card-container").html(cardsTpl(sGame));
	var width = Math.max.apply(Math, $('#card-container a').map(function(){ return $(this).width(); }).get());
	$('#card-container a').width(width);
}