package controllers.actors.entity

import io.circe._

object AccountType extends Enumeration{
  val admin, user = Value
}
case class UserAuthentication(user: String, accountType: AccountType.Value)
case object UserAuthenticationFailure

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

class LoginResponseSuccess(val user_type: AccountType.Value) {
  val `$type`: String = "login_successful"
}
object LoginResponseSuccess{
  implicit val encodeResp: Encoder[LoginResponseSuccess] = (instance) => {
    Json.obj(
      ("$type", Json.fromString(instance.`$type`)),
      ("user_type", Json.fromString(instance.user_type.toString))
    )
  }
}
class LoginResponseError{
  val `$type`: String = "login_failed"
}
object LoginResponseError{
  implicit val encodeLoginErr: Encoder[LoginResponseError] = (instance) => Json.obj(
    ("$type", Json.fromString(instance.`$type`))
  )
}
