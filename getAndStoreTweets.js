var Twitter = require('twitter');
var AWS = require('aws-sdk');
require('dotenv').load();


AWS.config.update({
  region: "us-east-1",
});

var ddDoc = new AWS.DynamoDB.DocumentClient();

var table = 'Tweets'



var client = new Twitter({
	consumer_key: process.env.consumer_key,
	consumer_secret: process.env.consumer_secret,
	access_token_key: process.env.access_token_key,
	access_token_secret: process.env.access_token_secret,
});


keyword = 'paris'

function getAndStore(keyword) {

  client.stream('statuses/filter', {track: keyword}, function(stream) {
    stream.on('data', function(tweet) {
      if (tweet.coordinates) {
        //console.log(tweet.coordinates.coordinates);
        var params = {
          TableName: table,
          Item: {
              "tweet_id": tweet.id_str,
              "text": tweet.text,
              "coordinates": tweet.coordinates.coordinates.toString(),
              "created_at": tweet.created_at,
              "user_name": tweet.user.name
          }
        };
        console.log("Adding a new item...");
        ddDoc.put(params, function(err, data) {
            if (err) {
                console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
            } else {
                console.log("Added tweet from: ", JSON.stringify(tweet.user.name, null, 2));
            }
        });
      }
      else if (tweet.place != null) {
        if(tweet.place.place_type == 'city'){
        //console.log(tweet.place.full_name);
        //console.log(tweet.place.bounding_box.coordinates[0][0]);
        //console.log(tweet.text);
        var params = {
          TableName: table,
          Item: {
              "tweet_id": tweet.id_str,
              "text": tweet.text,
              "coordinates": tweet.place.bounding_box.coordinates[0][0].toString(),
              "created_at": tweet.created_at,
              "user_name": tweet.user.name
            }
          };
          console.log("Adding a new item...");
          ddDoc.put(params, function(err, data) {
              if (err) {
                  console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
              } else {
                  console.log("Added tweet from: ", JSON.stringify(tweet.user.name, null, 2));
              }
          });
        }
      }
      
    });
   
    stream.on('error', function(error) {
      throw error;
    });
  });
}


getAndStore(keyword);