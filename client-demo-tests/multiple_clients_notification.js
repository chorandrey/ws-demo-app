/*
Workflow algorithm:
1) user and admin are logging on to the server
2) user and admin subscribe to tables
3) user sends modify table request and gets error
4)

*/

var variables = require("./variables.js");

console.log("connection host: " + variables.host + " and port: " + variables.port);

const WebSocket = require('ws');
const adminSocket = new WebSocket(variables.getServer() + variables.applicationEndPoint);
const userSocket = new WebSocket(variables.getServer() + variables.applicationEndPoint);

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

