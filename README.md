Twitter-Map2
=============

    Plots tweets in real-time on Google maps - using Node.js, socket.io, alchemyapi, AWS DynamoDB, AWS SQS, AWS SNS 

    Tweet-plotter subscribes to a particular keyword and shows tweets in real-time. 
    

    So the sequence of events are like so: 

    1)  Receives an event from Twitter using the streaming API.
    2)  Saves the tweet to DynamoDB and sends an SNS to SQS that a tweet is ready to be processed
    3)  Query DynamoDB for existing tweets and graph them on a map
    4)  SNS is processed and a tweet is analyzed for sentiment, and a new SNS is sent to another SQS that a tweet is ready to be mapped
    5)  SNS is processed and new tweet locations and sentiment are sent to client and map is updated via websocket
    

    
    
    To Run:
    --------
    1) clone
    2) npm install
    3) npm start
    3) http://localhost:8080


Sam Lee (hsl2113), Junchao Lu (jlu4376)
