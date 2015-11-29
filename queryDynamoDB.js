// Scan through dynamo db and retrieve tweets which contains 'keyword' in text

var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-east-1",
});

var dynamodbDoc = new AWS.DynamoDB.DocumentClient();




var params = {
    TableName : "Tweets",
    ProjectionExpression: "#tweet_id, #t",
    FilterExpression: "#tweet_id > :tweet_id",  // retrieve tweets which has tweet_id greater than 0 (all tweets)
    ExpressionAttributeNames:{
        "#tweet_id": "tweet_id",
        "#t": "text"
    },
    ExpressionAttributeValues: {
        ":tweet_id": "000000000000000000"
    }
};

var query = exports;

query.queryDynamoDB = function(term) {
    console.log('*********************************');
    console.log("Querying in the table for ", term);
    console.log('*********************************');
    dynamodbDoc.scan(params, function(err, data) {
        if (err) {
            console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
        } else {
            console.log("Query succeeded.");
            data.Items.forEach(function(item) {

                if(item.text.toLowerCase().indexOf(term) > -1 ){
                    console.log("keyword found");
                    console.log("Tweet_ID: ", item.tweet_id + " - text: " + item.text);
                }
                else{
                    // console.log("keyword not found")
                }
            });
        }
    });
}