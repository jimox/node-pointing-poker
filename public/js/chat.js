var sTeam,
	sGame,
	socket;

$(function() {
	socket = io.connect('//localhost:1337');

	socket.on('message', function(data) {
		console.log(data.message);
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

	$("input#join-as-player").click(function() {
		joinGame("player");
	});

	$("input#join-as-observer").click(function() {
		joinGame("observer");
	});
});

function joinGame(userType) {
	var packet = { 
			userName: $('#user-name').val(),
			userType: userType,
			teamName: sTeam.name,
			gameName: sGame.name
		};
		socket.emit('join-game', packet);
}