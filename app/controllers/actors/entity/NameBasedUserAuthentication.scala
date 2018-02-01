package controllers.actors.entity

class NameBasedUserAuthentication extends UserAuthenticationProvider {
  val userKey = "user"
  val adminKey = "admin"

  override def authenticate(auth: LoginRequest): Option[UserAuthentication] = {
    if(auth.username.contains(userKey)) Some(UserAuthentication(auth.username, AccountType.user))
    else if(auth.username.contains(adminKey)) Some(UserAuthentication(auth.username, AccountType.admin))
    else None
  }
}
