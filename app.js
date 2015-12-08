var express = require('express')
var app = express();
var server = require('http').Server(app);
var path = __dirname + '/public/';
var io = require('socket.io')(server)
var getTweets = require('./getAndStoreTweets.js');
var config = require('./config.json');
var Consumer = require('sqs-consumer');


app.use(express.static('public'));
app.use(express.static('socket.io'));
app.use(express.static('../../node_modules/bootstrap/'));

//DEBUG='socket.io node app.js'



server.listen(8080);
console.log("listening on Port: 8080");

app.get('/', function(req, res) {
    res.sendFile(path + 'index.html');
});

var newArray = new Array();
var newPoints = 0;
var newSentiment = 0;

io.on('connection', function(socket) {
    socket.emit('news', {hello: 'world' });
    socket.on('selection', function (data) {
        console.log(data.ans);
        Search(data.ans, socket); //Search for chosen category
        getTweets.getAndStore(keywords[data.ans]);
        refreshMap(socket);
    });

});



// ***********************************************************************************
// Create a consumer that will grab new Tweet location + sentiment data from processor
// and send it to web client after they select their topic
// ***********************************************************************************


function refreshMap(socket) {
    var freshTweets = Consumer.create({
        queueUrl: config.QueueUrlUpdate,
        batchSize: 10,
        handleMessage: function (message, done) {
            var tweetData = JSON.parse(message.Body).Message.split(',');
            //var lng = parseFloat(tweetData[0]);
            //var lat = parseFloat(tweetData[1]);
            var sentiment = parseFloat((tweetData[2]));
            newArray.push(tweetData[0] +',' + tweetData[1]);
            newSentiment += sentiment;
            newPoints++;
            if (newPoints >= 5){
                newArray.push(newSentiment);
                socket.emit('mapUpdate', newArray);
                newSentiment = 0;
                newPoints = 0;
                newArray.length = 0;
            }    
            // delete message from sqs
            return done();
        }
    });

    freshTweets.on('error', function(err) {
        console.log(err);
    })

    freshTweets.start();
}




//var sqs = new AWS.SQS();




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
    // arr['sentiment'] = new Array();
    //arr['coordinates'] = new Array();
    // term to search for
    var term = "";
    // sentiment variable
    var sentiment = 0;
    

    if (keyword !== 'void' ){
        console.log('*******************************************');
        console.log("Querying in the table for category: " + keyword);
        console.log('*******************************************');
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
                                // arr['sentiment'].push("0");
                                arr.push(item.coordinates);
                            }
                            else{
                            	sentiment += parseFloat(item.sentiment);
                                // arr['sentiment'].push(item.sentiment);
                                arr.push(item.coordinates);
                            }
                        }
                        else{
                            //console.log("keyword not found")
                        }
                    }
                    
                });
            }
            //console.log(arr['coordinates']);
            arr.push(sentiment); // add total sentiment as last element in the array
            socket.emit('map', arr);
            //socket.emit('senti', sentiment);
        });
        
    }
    
}

