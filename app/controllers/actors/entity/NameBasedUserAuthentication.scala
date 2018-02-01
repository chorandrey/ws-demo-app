package controllers.actors.entity

class NameBasedUserAuthentication extends UserAuthenticationProvider {
  val userKey = "user"
  val adminKey = "admin"

  override def authenticate(auth: LoginRequest): Either[UserAuthenticationFailure.type , UserAuthentication] = {
    if(auth.username.contains(userKey)) Right(UserAuthentication(auth.username, AccountType.user))
    else if(auth.username.contains(adminKey)) Right(UserAuthentication(auth.username, AccountType.admin))
    else Left(UserAuthenticationFailure)
  }
}
