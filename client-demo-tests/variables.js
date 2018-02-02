exports.host = "127.0.0.1"
exports.port = "9000"

exports.pingEndPoint = "/ws/ping"
exports.applicationEndPoint = "/ws/application"
exports.getServer = function(){
  return "http://" + exports.host + ":" + exports.port;
}

exports.successString = "[SUCCESS] ";
exports.errorString = "[ERROR] ";