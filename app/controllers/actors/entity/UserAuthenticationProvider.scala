package controllers.actors.entity

trait UserAuthenticationProvider {
  def authenticate(auth: LoginRequest): Option[UserAuthentication]
}
