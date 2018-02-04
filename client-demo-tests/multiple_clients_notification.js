/*
Workflow algorithm:
1) user and admin are logging on to the server
2) user and admin subscribe to tables
3) user sends modify table request and gets error
4) admin sends modify table request ->
        admin and user get response - update notification
5) admin sends create table request
        admin and user get response - create table notification
5) admin sends create table request for beginning
        admin and user get response - create table notification
6) admin sends remove table request
        admin and user get response - remove table notification
7) admin sends remove table request with non-existing id
        admin gets error removal table
8) admin sends remove table request with non-existing id
        admin gets error update table
9) user sends unsubscribe from notifications
        admin sends create table request
        user doesn't get create table request

*/

var variables = require("./variables.js");

console.log("connection host: " + variables.host + " and port: " + variables.port);

const WebSocket = require('ws');
const adminSocket = new WebSocket(variables.getServer() + variables.applicationEndPoint);
const userSocket = new WebSocket(variables.getServer() + variables.applicationEndPoint);

const eventMessage = "message";
const eventOpen = "open";

const loginUser = {
  $type: "login",
  username: "user",
  password: "pssw"
};

const loginAdmin = {
  $type: "login",
  username: "admin",
  password: "pssw"
};

const subscribeTables = {
  "$type": "subscribe_tables"
};

const unsubscribeTables = {
  "$type": "unsubscribe_tables"
};

const addTableTempl = {
  "$type" : "add_table",
  "after_id" : 1,
  "table" : {"name" : "table - James Bond adventures", "participants" : 4}
};

// <---- Test (1): user and admin are logging on to the server

adminSocket.on("open", function(){
  loginUserAdmin(adminSocket, userSocket);
  //userSocket.on("open", function(){
    // both sockets are opened

  //})
})

function loginUserAdmin(adminSocket, userSocket){
  userSocket.on(eventMessage, function message(data){
    var loginResult = JSON.parse(data);
    var type = loginResult.$type; // must be "login_successful"
    var userType = loginResult.user_type; // "admin" or "user"

    var userLoginSuccess = true;
    if(type != "login_successful") userLoginSuccess = false;
    if(userType != "user") userLoginSuccess = false;

    if(userLoginSuccess){
      console.log(variables.successString + "login user success");
      userAdminSubscribe(adminSocket, userSocket); // <--------------------- call next test
    } else {
      console.log(variables.errorString + "login user error");
      process.exit(1);
    }
  });

  adminSocket.on(eventMessage, function message(data){
    var result = JSON.parse(data);
    var type = result.$type; // must be "login_successful"
    var userType = result.user_type; // "admin" or "user"

    var admLoginSuccess = true;
    if(type != "login_successful") admLoginSuccess = false;
    if(userType != "admin") admLoginSuccess = false;

    if(admLoginSuccess){
      console.log(variables.successString + "login admin success");
      userSocket.send(JSON.stringify(loginUser));
    } else {
      console.log(variables.errorString + "login admin error");
      process.exit(1);
    }
  });

  adminSocket.send(JSON.stringify(loginAdmin));
}


// <---- Test (2): user and admin subscribe to tables

function userAdminSubscribe(adminSocket, userSocket){
  adminSocket.removeAllListeners(eventMessage);
  userSocket.removeAllListeners(eventMessage);

  userSocket.on(eventMessage, function message(data){
      var loginResult = JSON.parse(data);
      var type = loginResult.$type; // must be "login_successful"
      var tableList = loginResult.tables;

      var userLoginSuccess = true;
      if(type != "table_list") userLoginSuccess = false;
      if(tableList.length == 0) userLoginSuccess = false;

      if(userLoginSuccess){
        console.log(variables.successString + "user gets table list");

        testUserEditTableError(adminSocket, userSocket); // <--------------- call next test
      } else {
        console.log(variables.errorString + "user didn't get table list");
        process.exit(1);
      }
    });

    adminSocket.on(eventMessage, function message(data){
      var result = JSON.parse(data);
      var type = result.$type; // must be "table_list"
      var tables = result.tables;

      var admLoginSuccess = true;
      if(type != "table_list") admLoginSuccess = false;
      if(tables.length == 0) admLoginSuccess = false; // non-empty tables list

      if(admLoginSuccess){
        console.log(variables.successString + "admin gets table list");
        userSocket.send(JSON.stringify(subscribeTables));
      } else {
        console.log(variables.errorString + "admin didn't get table list");
        process.exit(1);
      }
    });

    adminSocket.send(JSON.stringify(subscribeTables));
}

// <---- Test (3): user sends modify table request and gets error

function testUserEditTableError(adminSocket, userSocket) {
  adminSocket.removeAllListeners(eventMessage);
  userSocket.removeAllListeners(eventMessage);

  userSocket.on(eventMessage, function message(data) {
    var editResult = JSON.parse(data);
    var type = editResult.$type; // must be "not_authorized"

    var userTestSuccess = true;
    if (type != "not_authorized") userTestSuccess = false;

    if (userTestSuccess) {
      console.log(variables.successString + "user cannot update tables");
      testAdminModifyRequest(adminSocket, userSocket);
    } else {
      console.log(variables.errorString + "user was able to update table");
      process.exit(1);
    }
  });

  // user socket - send add table request
  userSocket.send(JSON.stringify(addTableTempl));
}

// <---- Test (4): 4) admin sends modify table request ->
//     admin and user get response - update notification

//Table(3, "table - Assassin's creed", 2)
const updateTableTemp = {
  "$type" : "update_table",
  "table" : {"id" : 3, "name" : "table - Assassin's creed: return", "participants" : 6}
};

var userCompleted = false;
var adminCompleted = false;
const awaitTimeDelay = 100;

/* checks that obj corresponds to updateTableTemp
result expected: Table updated
{
"$type": "table_updated",
"table": {
"id": 3,
"name": "table - Foo Fighters",
"participants": 9
}
}
*/
function checkTableUpdate(obj){
  var result = true;
  if(obj.$type != "table_updated") result = false;
  if(obj.table.id != 3) result = false;
  if(obj.table.name != "table - Assassin's creed: return") result = false;
  if(obj.table.participants != 6) result = false;
  return result;
}

function testAdminModifyRequest(adminSocket, userSocket) {
  adminSocket.removeAllListeners(eventMessage);
  userSocket.removeAllListeners(eventMessage);

  adminSocket.on(eventMessage, function message(data) {
    var notification = JSON.parse(data);
    if(checkTableUpdate(notification)) adminCompleted = true;
  });

  userSocket.on(eventMessage, function message(data) {
    var notification = JSON.parse(data);
    if(checkTableUpdate(notification)) userCompleted = true;
  });

  adminSocket.send(JSON.stringify(updateTableTemp));
  setTimeout(awaitAdminAndUser, 20, 10, adminSocket, userSocket);
}

function awaitAdminAndUser(triesCount, adminSocket, userSocket) {
  if (adminCompleted && userCompleted) {
    console.log(variables.successString + "user and client have got table updates");
    // call next function in chain

    loginRequestTest(adminSocket, userSocket);
    //process.exit(0); // <------------------------------
  } else if(triesCount == 0) {
    console.log(variables.errorString + "not all websocket clients got notification");
    process.exit(1);
  } else setTimeout(awaitAdminAndUser, awaitTimeDelay, triesCount - 1, adminSocket, userSocket);
}

// 5) admin sends create table request
//        admin and user get response - create table notification

const createTableSample = {
  "$type" : "add_table",
  "after_id" : 1,
  "table" : {"name" : "table - Extreme Foo Fighters", "participants" : 4}
};

const createSampleResponse = {
  "$type" : "table_added",
  "after_id" : 1,
  "table" : {"id" : 3, "name" : "table - Extreme Foo Fighters", "participants" : 4}
};

function checkTableResponse(objReceived){
  var checkCompleted = true;
  var table = objReceived.table;
  if(objReceived.$type != "table_added") checkCompleted = false;
  if(objReceived.after_id != 1) checkCompleted = false;
  if(table.name != "table - Extreme Foo Fighters") checkCompleted = false;
  if(table.participants != 4) checkCompleted = false;
  return checkCompleted;
}

function loginRequestTest(adminSocket, userSocket) {
  adminSocket.removeAllListeners(eventMessage);
  userSocket.removeAllListeners(eventMessage);
  adminCompleted = false;
  userCompleted = false;

  adminSocket.on(eventMessage, function message(data) {
    var notification = JSON.parse(data);
    if (checkTableResponse(notification)) adminCompleted = true;
  });

  userSocket.on(eventMessage, function message(data) {
    var notification = JSON.parse(data);
    if (checkTableResponse(notification)) userCompleted = true;
  });

  adminSocket.send(JSON.stringify(createTableSample));
  setTimeout(awaitLoginRequestTest, awaitTimeDelay, 10, adminSocket, userSocket);
}

function awaitLoginRequestTest(triesCount, adminSocket, userSocket) {
  if (adminCompleted && userCompleted) {
    console.log(variables.successString + "user and client have got notification - new table create");
    // call next function in chain
    process.exit(0); // <------------------------------
  } else if(triesCount == 0) {
    console.log(variables.errorString + "not all websocket clients got new table notification");
    process.exit(1);
  } else setTimeout(awaitAdminAndUser, awaitTimeDelay, triesCount - 1, adminSocket, userSocket);
}
