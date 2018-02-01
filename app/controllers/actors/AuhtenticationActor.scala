package controllers.actors

import akka.actor.{Actor, Props}
import controllers.actors.entity.{LoginRequest, UserAuthenticationFailure, UserAuthenticationProvider}

import scala.reflect.ClassTag

object AuhtenticationActor{
  def props(authenticator: UserAuthenticationProvider) = Props(new AuhtenticationActor(authenticator))
}

class AuhtenticationActor(val authenticator: UserAuthenticationProvider) extends Actor{

  override def receive: Receive = {
    case loginReq: LoginRequest => authenticator.authenticate(loginReq) match {
      case Left(failure) => sender() ! UserAuthenticationFailure
      case Right(success) => sender() ! success
    }
    case unknown @ _ => context.system.deadLetters ! unknown
  }
}
