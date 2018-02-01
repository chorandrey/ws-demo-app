package controllers.actors

import akka.actor._
import controllers.actors.entity._
import io.circe._
import io.circe.parser._


object ApplicationActor{
  def props(out: ActorRef, authenticationActor: ActorRef) = Props(new ApplicationActor(out, authenticationActor))
}

class ApplicationActor(out: ActorRef, authenticationActor: ActorRef) extends Actor {
  var authentication: Option[UserAuthentication] = None

  context.become(unathenticated) //workflow for not-authenticated clients

  // for authenticated clients
  def receive: Receive = {
    case msg: String => {
      parse(msg) match {
        case Left(err) =>
          val errStr = "parsing failure: " + err.getMessage()
          out ! stringify(new WSError(errStr))

        case Right(json) => {
          // determine type of object
          val objectType = json.asObject.flatMap(_.apply("$type"))
          println("objectType: " + objectType)
        }
      }
    }
  }

  def unathenticated: Receive = {
    case msg: String => {
      val loginReq = parse(msg).toOption.flatMap(_.as[LoginRequest].toOption)
      val authReq: Boolean = loginReq.exists(loginReq => {
        authenticationActor ! loginReq
        true
      })
      if(! authReq) out ! stringify(new LoginResponseError())
    }
    case authResp: UserAuthentication => {
      this.authentication = Some(authResp)
      out ! stringify(new LoginResponseSuccess(authResp.accountType))
      context.unbecome()
    }
    case failure: LoginResponseError => out ! stringify(failure)
    case unknown@_ => context.system.deadLetters ! unknown
  }

  override def postStop(): Unit = {
    // socket closed by client or timeout
  }

  def stringify[T](entity: T)(implicit encoder: Encoder[T]): String = encoder.apply(entity).spaces2
}
