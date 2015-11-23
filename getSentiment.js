var AlchemyAPI = require('./alchemyapi_node/alchemyapi');
var AWS = require('aws-sdk');
var alchemyapi = new AlchemyAPI();
var config = require('./config.json');

AWS.config.update({
  region: "us-east-1",
});

var dd = new AWS.DynamoDB();

var table = 'Tweets'
var sqs = new AWS.SQS();



var receieveMessageParams = {
	QueueUrl: config.QueueUrl,
	MaxNumberOfMessages: 10
};

// get message from SQS
function getMessages() {
	sqs.receiveMessage(receieveMessageParams, receiveMessageCallback);
}

function receiveMessageCallback(err, data) {
	if (data && data.Messages && data.Messages.length > 0) {
		for (var i = 0; i < data.Messages.length; i++) {
			console.log('received a new message');
			//console.log(JSON.parse(data.Messages[i].Body).Message);
			var params = {
				TableName: table,
				Key: {
					'tweet_id': {S:JSON.parse(data.Messages[i].Body).Message}
				},
				AttributesToGet: ['text']
			};
			// get Tweet text from DynamoDB using the tweet_id field
			dd.getItem(params, function(err, data) {
				if (err) console.log(err);
				else {
					alchemyapi.sentiment('text',data.Item.text.S, {}, function(response) {
						console.log(data.Item.text.S,'Sentiment: ' + response['docSentiment']['type']);	
					});
				}
			});


			// Delete the message after reading it
			var deleteMessageParams = {
				QueueUrl: config.QueueUrl,
				ReceiptHandle: data.Messages[i].ReceiptHandle
			};
			//sqs.deleteMessage(deleteMessageParams, deleteMessageCallback)
		}
		getMessages();
	}
	else {
		console.log("waiting for messages");
		setTimeout(getMessages(), 100);
	}
}

function deleteMessageCallback(err, data) {
	console.log('deleted a message');
}

setTimeout(getMessages(), 100);
