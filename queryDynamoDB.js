// Scan through dynamo db and retrieve tweets which contains 'keyword' in text

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
keywords['Twitter Trending'] = 'top trends twitter api results';

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

var query = exports;




var term = "";
    
query.queryDynamoDB = function (keyword){
    var arr = new Array();
    arr['sentiment'] = new Array();
    arr['coordinates'] = new Array();

    if (keyword !== 'void' ){
        console.log('*********************************');
        console.log("Querying in the table for category" + keyword);
        console.log('*********************************');
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
                                console.log('0');
                                arr['sentiment'].push("0");
                                arr['coordinates'].push(item.coordinates);
                            }
                            else{
                                console.log('1');
                                arr['sentiment'].push(item.sentiment);
                                arr['coordinates'].push(item.coordinates);
                            }
                        }
                        else{
                            //console.log("keyword not found")
                        }
                    }
                    
                });
            }
            console.log(arr);
        });
        
    }
    
}

