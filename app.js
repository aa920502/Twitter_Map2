var express = require('express')
var app = express();
var server = require('http').Server(app);
var path = __dirname + '/public/';
var io = require('socket.io')(server)
var getTweets = require('./getAndStoreTweets.js');

app.use(express.static('public'));
app.use(express.static('socket.io'));
app.use(express.static('../../node_modules/bootstrap/'));

DEBUG='socket.io node app.js'


server.listen(8080);
console.log("listening on Port: 8080");

app.get('/', function(req, res) {
    res.sendFile(path + 'index.html');
});

io.on('connection', function(socket) {
    socket.emit('news', {hello: 'world' });
    socket.on('selection', function (data) {
        console.log(data.ans);
        Search(data.ans, socket); //Search for chosen category
        //getTweets.getAndStore(keywords[data.ans]);
    });
});



// ****************************************************************************
// Scan through dynamo db and retrieve tweets which contains 'keyword' in text
// ****************************************************************************

var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-east-1",
});

var dynamodbDoc = new AWS.DynamoDB.DocumentClient();


var keywords = new Array();
keywords['Cities'] = new Array('new york', 'paris', 'los angeles', 'london', 'tokyo', 'rome', 'shanghai');
keywords['Sports'] = new Array('soccer', 'football', 'basketball', 'baseball', 'tennis', 'golf', 'giants', 'patriots', 'barcelona', 'real madrid');
keywords['Holidays'] = new Array('thanksgiving', 'christmas', 'new year', 'xmas');
keywords['Politics'] = new Array('obama', 'clinton', 'trump', 'republican', 'democrat', 'rubio', 'bush', 'sanders', 'bernie', 'carson', 'cruz');
keywords['Twitter Trending'] = '';

var params = {
    TableName : "Tweets",
    ProjectionExpression: "#tweet_id, #t, #s, #c",
    FilterExpression: "#tweet_id > :tweet_id",  // retrieve tweets which has tweet_id greater than 0 (all tweets)
    ExpressionAttributeNames:{
        "#tweet_id": "tweet_id",
        "#t": "text",
        "#s": "sentiment",
        "#c": "coordinates"
    },
    ExpressionAttributeValues: {
        ":tweet_id": "000000000000000000"
    }
};


function Search(keyword, socket){
    var arr = new Array();
    arr['sentiment'] = new Array();
    arr['coordinates'] = new Array();
    // term to search for
    var term = "";
    // sentiment variable
    var sentiment = 0;
    

    if (keyword !== 'void' ){
        console.log('*********************************');
        console.log("Querying in the table for category: " + keyword);
        console.log('*********************************');
        dynamodbDoc.scan(params, function(err, data) {
            if (err) {
                console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
            } else {
                console.log("Query succeeded.");
                data.Items.forEach(function(item) {
                    // console.log(item.text.toLowerCase());
                    for (var i = 0; i < keywords[keyword].length; i++) {
                        term = keywords[keyword][i];
                        if(item.text.toLowerCase().indexOf(term) > -1 ){
                            // console.log("keyword found");
                            // console.log("Tweet_ID: ", item.tweet_id + " - text: " + item.text + " - sentiment " + item.sentiment + " - coordinates" + item.coordinates);
                            if(!item.sentiment){
                                arr['sentiment'].push("0");
                                arr['coordinates'].push(item.coordinates);
                            }
                            else{
                            	sentiment += parseFloat(item.sentiment);
                                arr['sentiment'].push(item.sentiment);
                                arr['coordinates'].push(item.coordinates);
                            }
                        }
                        else{
                            //console.log("keyword not found")
                        }
                    }
                    
                });
            }
            //console.log(arr['coordinates']);
            console.log("current sentiment is: " + sentiment);
            socket.emit('map', arr['coordinates']);
        });
        
    }
    
}

