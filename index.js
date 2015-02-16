var config = require('./config')
var express = require('express');
var app = express();
var port = process.env.PORT || 1337;
var mongodb = require('mongodb');
var uri = config.mongouri;

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
	  			console.log(docs[0].name);
	    		res.render('page', { 'teams': docs });
			});
	});
});

var io = require('socket.io').listen(app.listen(port));

io.sockets.on('connection', function(socket) {
	socket.on('send-name', function(data) {
		io.sockets.emit('message', { message: data.name + ' joined.' });
	});
});

console.log('listening on port ' + port);