var express = require('express')
var app = express();
var server = require('http').Server(app);
//var router = app.Router();
var path = __dirname + '/public/';
var io = require('socket.io')(server)

app.use(express.static('public'));
app.use(express.static('socket.io'));
app.use(express.static('../../node_modules/bootstrap/'));

DEBUG='socket.io node app.js'

// router.use(function (req, res, next) {
// 	console.log('/' + req.method);
// 	next();
// });
server.listen(8080);
console.log("listening on Port: 8080");

app.get('/', function(req, res) {
	res.sendFile(path + 'index.html');
});

io.on('connection', function(socket) {
	socket.emit('news', {hello: 'world' });
	socket.on('other', function (data) {
		console.log(data);
	});
});

//app.use('/', router);

// app.use('*', function(req,res) {
// 	res.sendFile(path + '404.html');
// });


// app.listen(8080, function() {
// 	console.log("listening on Port: 8080");
// });