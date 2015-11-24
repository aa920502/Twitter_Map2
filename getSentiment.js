var AlchemyAPI = require('./alchemyapi_node/alchemyapi');
var AWS = require('aws-sdk');
var alchemyapi = new AlchemyAPI();
var config = require('./config.json');

AWS.config.update({
  region: "us-east-1",
});

var dynamodbDoc = new AWS.DynamoDB.DocumentClient()
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
			

			var sentiment = 'default' // variable to hold sentiment value
			var tweet_id = JSON.parse(data.Messages[i].Body).Message;
			//console.log('got message #',i, 'with tweet_id:'+tweet_id);
			// get Tweet text from DynamoDB using the tweet_id field			
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
					// use alchemy to decide sentiment type of tweet text
					alchemyapi.sentiment('text',data.Item.text.S, {}, function(response) {
						if (response.status == 'ERROR') {
							console.log("caught error ",response);
						}
						else {
						console.log("calling updateTweet with text", data.Item.text.S , " and ", response);
						updateTweet(response, tweet_id);
						}	
					});
				}
			});

			// Delete the message after reading it
			var deleteMessageParams = {
				QueueUrl: config.QueueUrl,
				ReceiptHandle: data.Messages[i].ReceiptHandle
			};
			sqs.deleteMessage(deleteMessageParams, deleteMessageCallback)
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


function updateTweet(response, tweet_id) {
	// update in dynamo db
	var sentiment = response['docSentiment']['type'];
	var score = '0';
	if (sentiment !== 'neutral'){
		score = response['docSentiment']['score'];
	}
	//console.log(sentiment);
	var update_params = {
	    TableName:table,
	    Key: {
	    	'tweet_id': {S:tweet_id}
	    },
	    UpdateExpression: "SET sentiment = :attrValue",
	    ExpressionAttributeValues : {
			":attrValue" : {S: score}
		},
		ReturnValues: "UPDATED_NEW"
	};
	//console.log(tweet_id);
	//console.log("Updating the item...");
	dd.updateItem(update_params, function(err, data) {
	    if (err) {
	        console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
	    } else {
	        //console.log("Updated TweetID:", tweet_id, JSON.stringify(data, null, 2));
	    }
	});
}

// function describeTable(){
// 	var params = {
// 	    TableName: table,
// 	};
// 	dd.describeTable(params, function(err, data) {
// 	    if (err) console.log(err); // an error occurred
// 	    else console.log(data); // successful response
// 	});
// }

// describeTable()

setTimeout(getMessages(), 100);
