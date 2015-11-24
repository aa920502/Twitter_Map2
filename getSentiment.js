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
			console.log('received a new message');

			var sentiment = 'default' // variable to hold sentiment value

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
					// use alchemy to decide sentiment type of tweet text
					alchemyapi.sentiment('text',data.Item.text.S, {}, function(response) {
						sentiment = response['docSentiment']['type']
						console.log(data.Item.text.S,'Sentiment: ' + sentiment);	
					});
				}
			});

			// update in dynamo db
			var update_params = {
			    TableName:table,
			    Key:{
			        'tweet_id': {S:JSON.parse(data.Messages[i].Body).Message}
			    },
			    UpdateExpression: "SET #attrName =:attrValue",
			    ExpressionAttributeNames : {
					"#attrName" : "sentiment"
				},
			    ExpressionAttributeValues:{
			        ":attrValue" : {"S": sentiment}
			    },
			};
			console.log("Updating the item...");
			dynamodbDoc.update(update_params, function(err, data) {
			    if (err) {
			        console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
			    } else {
			        console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
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
