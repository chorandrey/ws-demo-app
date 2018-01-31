var variables = require("./variables.js");

console.log("connection host: " + variables.host + " and port: " + variables.port);

function getServer(){
	return "http://" + variables.host + ":" + variables.port;
}

const WebSocket = require('ws');

const ws = new WebSocket(getServer() + variables.applicationEndPoint);

function receiveResponse(data){
  console.log("response for login packet: " + data);
}

function sendLogin(webSocket){
	console.log("Sending ping request");
	var loginTemplate = {
		$type: "login",
		username: "user1234",
		password: "password1234"
	};
	webSocket.send(JSON.stringify(loginTemplate));
	webSocket.on('message', receiveResponse);
}

ws.on('open', function open() {
  sendLogin(ws, 1);
});

ws.on('message', function message(data){
	console.log("message received: " + data);
});

