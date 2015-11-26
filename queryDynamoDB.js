var AWS = require("aws-sdk");

AWS.config.update({
  region: "us-east-1",
});

var dynamodbDoc = new AWS.DynamoDB.DocumentClient();

console.log("Querying in the table");

var params = {
    TableName : "Tweets",
    KeyConditionExpression: "#tweet_id = :tweet_id",
    ExpressionAttributeNames:{
        "#tweet_id": "tweet_id"
    },
    ExpressionAttributeValues: {
        ":tweet_id": '669291267507908608'
    }
};

dynamodbDoc.query(params, function(err, data) {
    if (err) {
        console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
    } else {
        console.log("Query succeeded.");
        data.Items.forEach(function(item) {
            console.log("Tweet_ID: ", item.tweet_id + " - text: " + item.text);
            var term = 'New York';
            if(item.text.indexOf(term) > -1 ){
                console.log("keyword found");
            }
            else{
                console.log("keyword not found")
            }
        });
    }
});