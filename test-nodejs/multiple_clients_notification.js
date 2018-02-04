/*
Workflow algorithm:
1) user and admin are logging on to the server
2) user and admin subscribe to tables
3) user sends modify table request and gets error
4) admin sends modify table request ->
        admin and user get response - update notification
5) admin sends create table request
        admin and user get response - create table notification
6) admin sends create table request for beginning
        admin and user get response - create table notification
7) admin sends remove table request
        admin and user get response - remove table notification
8) admin sends remove table request with non-existing id
        admin gets error removal table
9) admin sends update table request with non-existing id
        admin gets error update table
10) user sends unsubscribe from notifications
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

// @use_value
var tableObjectId1;
var tableObjectId2;

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
        tableObjectId1 = tableList[0].id;
        tableObjectId2 = tableList[1].id;
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

// @use_value
var recentlyCreatedTableId;

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
    recentlyCreatedTableId = notification.table.id;
    if (checkTableResponse(notification)) userCompleted = true;
  });

  adminSocket.send(JSON.stringify(createTableSample));
  setTimeout(awaitLoginRequestTest, awaitTimeDelay, 10, adminSocket, userSocket);
}

function awaitLoginRequestTest(triesCount, adminSocket, userSocket) {
  if (adminCompleted && userCompleted) {
    console.log(variables.successString + "user and client have got notification - new table create");
    // call next function in chain
    deleteTableSampleTest(adminSocket, userSocket);
    //process.exit(0); // <------------------------------
  } else if(triesCount == 0) {
    console.log(variables.errorString + "not all websocket clients got new table notification");
    process.exit(1);
  } else setTimeout(awaitAdminAndUser, awaitTimeDelay, triesCount - 1, adminSocket, userSocket);
}

//6) admin sends create table request for beginning
//        admin and user get response - create table notification

//TODO

//7) admin sends remove table request
//        admin and user get response - remove table notification

const removeTableSample = {
"$type": "remove_table",
"id": -1
};

function removeTableResponse(objReceived){
  var checkCompleted = true;
  if(objReceived.$type != "table_removed") checkCompleted = false;
  if(objReceived.id != recentlyCreatedTableId) checkCompleted = false;
  return checkCompleted;
}

function deleteTableSampleTest(adminSocket, userSocket) {
  adminSocket.removeAllListeners(eventMessage);
  userSocket.removeAllListeners(eventMessage);
  adminCompleted = false;
  userCompleted = false;

  adminSocket.on(eventMessage, function message(data) {
    var notification = JSON.parse(data);
    if (removeTableResponse(notification)) adminCompleted = true;
  });

  userSocket.on(eventMessage, function message(data) {
    var notification = JSON.parse(data);
    if (removeTableResponse(notification)) userCompleted = true;
  });

  var removeTableRequest = Object.assign({}, removeTableSample, { id: recentlyCreatedTableId});
  adminSocket.send(JSON.stringify(removeTableRequest));
  setTimeout(awaitRemoveRequestTest, awaitTimeDelay, 10, adminSocket, userSocket);
}

function awaitRemoveRequestTest(triesCount, adminSocket, userSocket) {
  if (adminCompleted && userCompleted) {
    console.log(variables.successString + "table remove test completed");
    // call next function in chain
    errorDeleteTableSampleTest(adminSocket, userSocket);
    //process.exit(0); // <------------------------------
  } else if(triesCount == 0) {
    console.log(variables.errorString + "not all websocket clients got new table notification");
    process.exit(1);
  } else setTimeout(awaitAdminAndUser, awaitTimeDelay, triesCount - 1, adminSocket, userSocket);
}

//8) admin sends remove table request with non-existing id
//        admin gets error removal table (but not client)

function errorRemoveTableResponse(objReceived){
  var checkCompleted = true;
  if(objReceived.$type != "removal_failed") checkCompleted = false;
  if(objReceived.id != recentlyCreatedTableId) checkCompleted = false;
  return checkCompleted;
}

function errorDeleteTableSampleTest(adminSocket, userSocket) {
  adminSocket.removeAllListeners(eventMessage);
  userSocket.removeAllListeners(eventMessage);
  adminCompleted = false;
  userCompleted = false;

  adminSocket.on(eventMessage, function message(data) {
    var notification = JSON.parse(data);
    if (errorRemoveTableResponse(notification)) adminCompleted = true;
  });

  userSocket.on(eventMessage, function message(data) {
    var notification = JSON.parse(data);
    console.log("\tUser socket: " + data);
    if (errorRemoveTableResponse(notification)) userCompleted = true;
  });

  var removeTableRequest = Object.assign({}, removeTableSample, { id: recentlyCreatedTableId});
  adminSocket.send(JSON.stringify(removeTableRequest));
  setTimeout(awaitErrorDeleteTableSampleTest, awaitTimeDelay, 10, adminSocket, userSocket);
}

function awaitErrorDeleteTableSampleTest(triesCount, adminSocket, userSocket) {
  if (adminCompleted && !userCompleted && triesCount == 0) {
    console.log(variables.successString + "not-existing remove test completed");
    // call next function in chain
    errorUpdateTableTest(adminSocket, userSocket);
    //process.exit(0); // <------------------------------
  } else if(triesCount == 0) {
    process.exit(1);
  } else setTimeout(awaitErrorDeleteTableSampleTest, awaitTimeDelay, triesCount - 1, adminSocket, userSocket);
}

//9) admin sends update table request with non-existing id
//        admin gets error update table (but not clients)

const updateTableSampe = {
"$type": "update_table",
"table": {
"id": -1,
"name": "table - Foo Fighters",
"participants": 4
}
};

function errorUpdateTableResponse(objReceived){
  var checkCompleted = true;
  if(objReceived.$type != "update_failed") checkCompleted = false;
  if(objReceived.id != recentlyCreatedTableId) checkCompleted = false;
  return checkCompleted;
}

function errorUpdateTableTest(adminSocket, userSocket) {
  adminSocket.removeAllListeners(eventMessage);
  userSocket.removeAllListeners(eventMessage);
  adminCompleted = false;
  userCompleted = false;

  adminSocket.on(eventMessage, function message(data) {
    var notification = JSON.parse(data);
    if (errorUpdateTableResponse(notification)) adminCompleted = true;
  });

  userSocket.on(eventMessage, function message(data) {
    var notification = JSON.parse(data);
    if (errorUpdateTableResponse(notification)) userCompleted = true;
  });

  var updateTableRequest = Object.assign({}, updateTableSampe, { table: {
    id: recentlyCreatedTableId,
    name: updateTableSampe.table.name,
    participants: updateTableSampe.table.participants
  }});
  adminSocket.send(JSON.stringify(updateTableRequest));
  setTimeout(awaitErrorUpdateTableTest, awaitTimeDelay, 10, adminSocket, userSocket);
}

function awaitErrorUpdateTableTest(triesCount, adminSocket, userSocket) {
  if (adminCompleted && !userCompleted && triesCount == 0) {
    console.log(variables.successString + "not-existing table update test completed");
    // call next function in chain
    unsubscribeTableTest(adminSocket, userSocket);
    //process.exit(0); // <------------------------------
  } else if(triesCount == 0) {
    process.exit(1);
  } else setTimeout(awaitErrorUpdateTableTest, awaitTimeDelay, triesCount - 1, adminSocket, userSocket);
}

//10) user sends unsubscribe from notifications
//        admin sends create table request
//        user doesn't get create table request

const unsubscribeTemplate = { $type : "unsubscribe_tables" };

function unsubscribeTableTest(adminSocket, userSocket) {
  adminSocket.removeAllListeners(eventMessage);
  userSocket.removeAllListeners(eventMessage);
  adminCompleted = false;
  userCompleted = false;

  adminSocket.on(eventMessage, function message(data) {
    // no response is expected
    adminCompleted = true;
  });

  userSocket.on(eventMessage, function message(data) {
  // no response is expected
    userCompleted = true;
  });

  adminSocket.send(JSON.stringify(unsubscribeTemplate));
  userSocket.send(JSON.stringify(unsubscribeTemplate));
  setTimeout(awaitUnsubscribeTest, awaitTimeDelay, 10, adminSocket, userSocket);
}

function awaitUnsubscribeTest(triesCount, adminSocket, userSocket) {
  if (!adminCompleted && !userCompleted && triesCount == 0) {
    console.log(variables.successString + "unsubscribe test completed");
    console.log("\n\n" + variables.successString + "all tests completed");
    process.exit(0); // <------------------------------
  } else if(triesCount == 0) {
    process.exit(1);
  } else setTimeout(awaitUnsubscribeTest, awaitTimeDelay, triesCount - 1, adminSocket, userSocket);
}
