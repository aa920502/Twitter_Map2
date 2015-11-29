var express = require('express')
var app = express();
var server = require('http').Server(app);
//var router = app.Router();
var path = __dirname + '/public/';
var io = require('socket.io')(server)

var query = require('./queryDynamoDB.js');

app.use(express.static('public'));
app.use(express.static('socket.io'));
app.use(express.static('../../node_modules/bootstrap/'));

DEBUG='socket.io node app.js'

var keywords = new Array();
keywords['Cities'] = new Array('new york', 'paris', 'los angeles', 'london', 'tokyo', 'rome', 'shanghai');
keywords['Sports'] = new Array('soccer', 'football', 'basketball', 'baseball', 'tennis', 'golf', 'giants', 'patriots', 'barcelona', 'real madrid');
keywords['Holidays'] = new Array('thanksgiving', 'christmas', 'new year', 'xmas');
keywords['Politics'] = new Array('obama', 'clinton', 'trump', 'republican', 'democrat', 'rubio', 'bush', 'sanders', 'bernie', 'carson', 'cruz');
keywords['Twitter Trending'] = 'top trends twitter api results';

//console.log(keywords['currently trending']);

function searchDB(keyword){
	if (keyword !== 'void' ){
		for (var i = 0; i < keywords[keyword].length; i++) {
			query.queryDynamoDB(keywords[keyword][i]);
		}
	}
}
//query.queryDynamoDB(keywords['holidays'][0]);

//searchDB('politics');

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
		console.log(data.ans);
		searchDB(data.ans);
	});
});

//app.use('/', router);

// app.use('*', function(req,res) {
// 	res.sendFile(path + '404.html');
// });


// app.listen(8080, function() {
// 	console.log("listening on Port: 8080");
// });