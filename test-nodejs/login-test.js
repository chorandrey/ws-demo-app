var variables = require("./variables.js");

console.log("connection host: " + variables.host + " and port: " + variables.port);


const WebSocket = require('ws');
const ws = new WebSocket(variables.getServer() + variables.applicationEndPoint);

const eventMessage = "message"

const loginTemplate = {
		$type: "login",
		username: null,
		password: null
}

/*
Test workflow:
1) Send invalid object
2) Check response for invalid object
3) Send valid login object but with incorrect credentials
4) Check response
5) Send valid login object with correct credentials (type is "user")
6) Check answer
7) Send valid login object with correct credentials (type is "admin")
8) Check answer
*/
var testFunctions = [testLoginInvalidObj, testLoginInvalidCredentials, testLoginValidUserCredentials, testLoginValidAdminCredentials];

function testLoginInvalidObj(webSocket, testSequence){
  var invObject = {
    "$type": "unknown",
    "parameter": "something"
  }
  var jsonReq = JSON.stringify(invObject)

  webSocket.removeAllListeners(eventMessage)
  webSocket.on(eventMessage, function(data){
    // check response
    var response = JSON.parse(data);

    var resultCheck = true;
    if(response.$type != "login_failed") {
      resultCheck = false;
    }
     if(Object.keys(response).length != 1) resultCheck = false;

     if(resultCheck){
       console.log("[SUCCESS] testLoginInvalidObj test successful");
       webSocket.removeAllListeners(eventMessage);

       // run next test
       runSequence(webSocket, testSequence);
     } else {
       console.log("[ERROR] testLoginInvalidObj test finished with errors");
       process.exit(1);
     }
  });

  webSocket.send(JSON.stringify(invObject));
}

function testLoginInvalidCredentials(webSocket, testSequence){
  var invalidCreds = {
    "$type": "login",
    "username": "any",
    "password": "pasword"
  }
  var jsonReq = JSON.stringify(invalidCreds)

  webSocket.removeAllListeners(eventMessage)
  webSocket.on(eventMessage, function(data){
    // check response
    var response = JSON.parse(data);

    var resultCheck = true;
    if(response.$type != "login_failed") resultCheck = false;
    if(Object.keys(response).length != 1) resultCheck = false;

     if(resultCheck){
       console.log("[SUCCESS] invalidCreds test successful");
       webSocket.removeAllListeners(eventMessage);

       // run next test
       runSequence(webSocket, testSequence);
     } else {
       console.log("[ERROR] invalidCreds test finished with errors");
       process.exit(1);
     }
  });

  webSocket.send(JSON.stringify(invalidCreds));
}

function testLoginValidUserCredentials(webSocket, testSequence){
  var validUserCreds = {
    "$type": "login",
    "username": "user20932",
    "password": "pasword"
  };
  var jsonReq = JSON.stringify(validUserCreds);

  webSocket.removeAllListeners(eventMessage);
  webSocket.on(eventMessage, function(data){
    // check response
    var response = JSON.parse(data);

    var resultCheck = true;
    if(response.$type != "login_successful") resultCheck = false;
    if(response.user_type != "user") resultCheck = false;
    if(Object.keys(response).length != 2) resultCheck = false;
     if(resultCheck){
       console.log("[SUCCESS] validUserCreds test successful");
       webSocket.removeAllListeners(eventMessage);

       // run next test
       runSequence(webSocket, testSequence);
     } else {
       console.log("[ERROR] validUserCreds test finished with errors");
       process.exit(1);
     }
  });

  webSocket.send(JSON.stringify(validUserCreds));
}

function testLoginValidAdminCredentials(webSocket, testSequence){
  // new websocket
  var ws = new WebSocket(variables.getServer() + variables.applicationEndPoint);
  ws.on('open', function open() {
    var adminCreds = {
        "$type": "login",
        "username": "admin21",
        "password": "pasword"
      };
      var jsonReq = JSON.stringify(adminCreds);

      ws.removeAllListeners(eventMessage);
      ws.on(eventMessage, function(data){
        // check response
        var response = JSON.parse(data);
        var resultCheck = true;

        if(response.$type != "login_successful") resultCheck = false;
        if(response.user_type != "admin") resultCheck = false;
        if(Object.keys(response).length != 2) resultCheck = false;

         if(resultCheck){
           console.log("[SUCCESS] adminCreds test successful");
           webSocket.removeAllListeners(eventMessage);

           // run next test
           runSequence(webSocket, testSequence);
         } else {
           console.log("[ERROR] adminCreds test finished with errors");
           process.exit(1);
         }
      });

      ws.send(JSON.stringify(adminCreds));
  });


}

// run next test
function runSequence(webSocket, testSequence){
       webSocket.removeAllListeners(eventMessage);
       if(testSequence != null && testSequence.length > 0){
         var nextTest = testSequence.shift();
         nextTest(webSocket, testSequence);
       }
       else {
         console.log("\n\n[SUCCESS] All tests run correctly. Exit");
         process.exit(0);
       }
}


ws.on('open', function open() {
  runSequence(ws, testFunctions);
});
