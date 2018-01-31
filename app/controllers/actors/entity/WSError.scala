package controllers.actors.entity

import io.circe.Decoder.Result
import io.circe._
import io.circe.parser._

class WSError(val message: String){
  def toJson: String = Encoder[WSError].apply(this).spaces2
}

object WSError {
  implicit val encodeError: Encoder[WSError] = new Encoder[WSError] {
    override def apply(a: WSError): Json = Json.fromJsonObject(
      JsonObject.apply(
        ("$type", Json.fromString("Error")),
        ("message", Json.fromString(a.message))))
  }
}
