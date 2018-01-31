package controllers.actors.entity

import io.circe.{Decoder, DecodingFailure}

object AccountType extends Enumeration{
  val admin, user = Value
}
case class UserAuthentication(user: String, accountType: AccountType.Value)

case class LoginRequest(username: String, password: String)
object LoginRequest{
  implicit val decodeLoginReq: Decoder[LoginRequest] = (hCursor) => {
    for{
      tpe <- hCursor.downField("$type").as[String]
      username <- hCursor.downField("username").as[String]
      password <- hCursor.downField("password").as[String]
    } yield LoginRequest(username, password)
  }
}

class LoginResponseSuccess(user_type: String) {
  val `$type`: String = "login_successful"
}
class LoginResponseError
