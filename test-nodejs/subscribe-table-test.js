var variables = require("./variables.js");

console.log("connection host: " + variables.host + " and port: " + variables.port);

// test workflow:
// user connects to server
// user send subscribe tables
// user gets response with tables
// user send unsubscribe tables

const WebSocket = require('ws');
const ws = new WebSocket(variables.getServer() + variables.applicationEndPoint);

const eventMessage = "message";

const loginUser = {
  $type: "login",
  username: "user",
  password: "pssw"
};

const subscribeTables = {
  "$type": "subscribe_tables"
};

const unsubscribeTables = {
  "$type": "unsubscribe_tables"
};

const initialTables = {
    "$type": "table_list",
    "tables": [{
        "id": 1,
        "name": "table - James Bond",
        "participants": 7
    }, {
        "id": 2,
        "name": "table - Mission Impossible",
        "participants": 4
    }]
}

ws.on(eventMessage, function(data){
    // check response from login
    var dataRead = JSON.parse(data);

    var resultCheck = true;
    if(dataRead.$type != "login_successful") resultCheck = false;
    if(dataRead.user_type != "user") resultCheck = false;
    if(Object.keys(dataRead).length != 2) resultCheck = false;

    if(resultCheck){
      console.log("[SUCCESS] logged in as user");
      ws.removeAllListeners(eventMessage);

      // next test part
      testSubscribe(ws);
    } else {
      console.log("[ERROR] cannot login using user account");
      process.exit(1);
    }
});

ws.on('open', function open() {
  ws.send(JSON.stringify(loginUser));
})

function testSubscribe(webSocket){
  webSocket.on(eventMessage, function(message){
    var receivedTableList = JSON.parse(message);

    // compare object with initialTables
    var checkResult = true;
    if(receivedTableList.$type != initialTables.$type) checkResult = false;
    if(receivedTableList.tables.length != initialTables.tables.length) checkResult = false;

    if(checkResult){
      webSocket.removeAllListeners(eventMessage);
      console.log("[SUCCESS] subscrite tables test completed");

      testUnsubscribe(webSocket);
    } else {
      //test error
      console.log("[ERROR] received table list and expected table list are not equal");
      process.exit(1);
    }
  });

  webSocket.send(JSON.stringify(subscribeTables));
}

function testUnsubscribe(webSocket){
  webSocket.send(JSON.stringify(unsubscribeTables));
  console.log("\n\n[SUCCESS] All tests run correctly. Exit");
  process.exit(0);
}
