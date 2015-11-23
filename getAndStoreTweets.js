var Twitter = require('twitter');
var AWS = require('aws-sdk');
require('dotenv').load();
var util = require('util');
var config = require('./config.json');


AWS.config.update({
  region: "us-east-1",
});

var ddDoc = new AWS.DynamoDB.DocumentClient();

var table = 'Tweets'

var sns = new AWS.SNS();

var client = new Twitter({
	consumer_key: process.env.consumer_key,
	consumer_secret: process.env.consumer_secret,
	access_token_key: process.env.access_token_key,
	access_token_secret: process.env.access_token_secret,
});


function publish(mesg) {
  var publishParams = {
    TopicArn : config.TopicArn,
    Message: mesg
  };
  sns.publish(publishParams, function(err, data) {
    process.stdout.write("published to Tweets:Topic\n");
  });
}

function storeAndPublishTweet(tweet){
  // If tweet's coordinates attribute is not null
  if (tweet.coordinates) {
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
            publish(tweet.id_str);    
        }
    });
  }

  // If tweet's place attribute is not null
  else if (tweet.place != null) {
    if(tweet.place.place_type == 'city'){
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
              publish(tweet.id_str);
          }
      });
    }
  }

}

// Stream tweets, store them to Dynamo DB, and use SNS to publish to topic
function getAndStore(){
  client.stream('statuses/sample', {language: 'en'}, function(stream) {
    stream.on('data', function(tweet) {
      storeAndPublishTweet(tweet);
    });
    stream.on('error', function(error) {
      throw error;
    });
  });  
}

getAndStore();