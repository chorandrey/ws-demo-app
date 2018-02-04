# WebSockets demo application
This is a starter application that shows how Play works with WebSockets.

## Running

Run this using [sbt](http://www.scala-sbt.org/).  If you downloaded this project from <http://www.playframework.com/download> then you'll find a prepackaged version of sbt in the project directory:

```bash
sbt run
```

And then go to <http://localhost:9000> to see the running web application.

If you run pre-packaged version of application, it will run on <http://0.0.0.0:9000>

## Controllers

- HomeController.scala:
  Simple response for request
- WebSocketController.scala
  Controller to work with websocket requests.

## Access websockets endpoints

Path | Description
---- | ------
/ws/ping | For ping requests
/ws/application | For API-defined requests + ping requests (duplicated just for case)

## Tests
There are some rough tests (I'm not an JavaScript expert, but I thought there is the most direct way to test application) written on JavaScript (NodeJS) to test appliation. They're located in "test-nodejs" folder (multiple_clients_notification.js, ping-test.js, subscribe-table-test.js).

