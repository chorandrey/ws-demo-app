var variables = require("./variables.js");

console.log("connection host: " + variables.host + " and port: " + variables.port);

function getServer(){
	return "http://" + variables.host + ":" + variables.port;
}

const WebSocket = require('ws');

const ws = new WebSocket(getServer() + variables.pingEndPoint);


/*
ping template:
{
"$type": "ping",
"seq": 1
}
*/
function sendPing(webSocket, seqNumber){
	console.log("Sending ping request");
	var pingTemplate = {
		$type: "ping",
		seq: 0
	};
	pingTemplate.seq = seqNumber;
	webSocket.send(JSON.stringify(pingTemplate));
	setTimeout(sendPing, 1000, webSocket, seqNumber + 1);
}

ws.on('open', function open() {
  sendPing(ws, 1);
});

ws.on('message', function message(data){
	console.log("message received: " + data);
});

