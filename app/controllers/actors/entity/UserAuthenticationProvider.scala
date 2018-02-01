package controllers.actors.entity

trait UserAuthenticationProvider {
  def authenticate(auth: LoginRequest): Either[UserAuthenticationFailure.type , UserAuthentication]
}
