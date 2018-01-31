package controllers.actors

import akka.actor.{Actor, Props}
import controllers.actors.entity.{LoginRequest, UserAuthenticationProvider}

import scala.reflect.ClassTag

object AuhtenticationActor{
  def props[Q](cl: Class[Q]) = Props(new AuhtenticationActor(cl.getClass))
}

class AuhtenticationActor[T <: UserAuthenticationProvider](clazz: Class[T]) extends Actor{
  val inst = clazz.newInstance()

  //val authenticator: UserAuthenticationProvider = ??? //classOf[T].newInstance()

  override def receive: Receive = {
    case loginReq: LoginRequest => {
      //sender() ! authenticator.authenticate(loginReq)
    }
    case unknown @ _ => context.system.deadLetters ! unknown
  }

}
