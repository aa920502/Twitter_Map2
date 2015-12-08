// var Twitter = require('twitter');
var AWS = require('aws-sdk');
var util = require('util');
var config = require('./config.json');
var Twit = require('twit');
require('dotenv').load();

AWS.config.update({
  region: "us-east-1",
});


var ddDoc = new AWS.DynamoDB.DocumentClient();

var table = 'Tweets'

var sns = new AWS.SNS();

var firstStream = 0;



// var client = new Twitter({
// 	consumer_key: process.env.consumer_key,
// 	consumer_secret: process.env.consumer_secret,
// 	access_token_key: process.env.access_token_key,
// 	access_token_secret: process.env.access_token_secret,
// });

var client = new Twit({
  consumer_key: process.env.consumer_key,
  consumer_secret: process.env.consumer_secret,
  access_token: process.env.access_token_key,
  access_token_secret: process.env.access_token_secret,
});

var stream = client.stream('statuses/filter', {track: 'zzaxw', language: 'en'});

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
          "user_name": tweet.user.name,
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
          "user_name": tweet.user.name,
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

var getTweets = exports;
// Stream tweets, store them to Dynamo DB, and use SNS to publish to topic
getTweets.getAndStore = function(categories){
  words = '';
  for (var i = 0; i < categories.length; i++) {
    if (i == categories.length - 1) {
      words += categories[i];
    }
    else {
      words += categories[i] + ',';
    }
  }
  
  console.log(words);

  if (firstStream != 0) {
    stream.stop();
    stream.start();
  }
  firstStream += 1;

  stream = client.stream('statuses/filter', {track: words, language: 'en'});
      stream.on('tweet', function(tweet) {
      //console.log(tweet.text);

      storeAndPublishTweet(tweet);
    });
    stream.on('error', function(error) {
      throw error;
    });
  
}

getTweets.stopStream = function() {
  client.stream.stop();
}



//getTweets.getAndStore(keywords);