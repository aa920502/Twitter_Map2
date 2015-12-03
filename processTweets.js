//retrieve tweets from SQS, process it with alchemy, and set sentiment value with corresponding tweet

var AlchemyAPI = require('./alchemyapi_node/alchemyapi');
var AWS = require('aws-sdk');
var alchemyapi = new AlchemyAPI();
var config = require('./config.json');
var Consumer = require('sqs-consumer');

AWS.config.update({
  region: "us-east-1",
});

//var dynamodbDoc = new AWS.DynamoDB.DocumentClient()
var dd = new AWS.DynamoDB();

var table = 'Tweets'
var sqs = new AWS.SQS();
var sns = new AWS.SNS();

var app = Consumer.create({
	queueUrl: config.QueueUrl,
	batchSize: 10,
	handleMessage: function (message, done) {
		var tweet_id = JSON.parse(message.Body).Message;
		var params = {
			TableName: table,
			Key: {
				'tweet_id': {S:tweet_id}
			},
			AttributesToGet: ['text']
		};
		dd.getItem(params, function(err, data) {
			if (err) console.log(err);
			else {
				alchemyapi.sentiment('text', data.Item.text.S, {}, function(response) {
					if (response.status == 'ERROR') {
						console.error('caught ERROR ', response);
					}
					else {
						//console.log('calling updateTweet with text', data.Item.text.S, ' and ', response);
						console.log('processed successfully');
						// save to DB
						updateTweet(response, tweet_id);

					}
				});
			}
		})

		return done();
	}
});

// process tweet info
function updateTweet(response, tweet_id) {
	var sentiment = response['docSentiment']['type'];
	var score = '0';
	if (sentiment !== 'neutral') {
		score = response['docSentiment']['score'];
	}

	var updateParams =  {
		TableName: table,
		Key: {
			'tweet_id': {S:tweet_id}
		},
		UpdateExpression: 'SET sentiment = :attrValue',
		ExpressionAttributeValues: {
			':attrValue': {S: score}
		},
		ReturnValues: 'ALL_NEW'
	};

	dd.updateItem(updateParams, function(err, data) {
		if (err) {
			console.error('Unable to update item. Error JSON:', JSON.stringify(err, null, 2));
		}
		else {
			// publish sns about processed tweet
			//console.log(data.Attributes.coordinates.S +','+ data.Attributes.sentiment.S);
			publish(data.Attributes.coordinates.S +','+ data.Attributes.sentiment.S);
		}
	});
}

// publish new sns stating new tweet has been processed
function publish(mesg) {
  var publishParams = {
    TopicArn : config.TopicArnUpdate,
    Message: mesg
  };
  sns.publish(publishParams, function(err, data) {
    process.stdout.write("published to TweetsProcessed:Topic\n");
  });
}

app.on('error', function(err) {
	console.log(err);
});

app.start();




// get message from SQS

