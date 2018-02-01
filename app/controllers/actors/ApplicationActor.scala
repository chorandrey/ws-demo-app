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
          out ! new WSError(errStr)

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
      println("unauthenticated: try to auth")
      val loginReq = parse(msg).toOption.flatMap(_.as[LoginRequest].toOption)
      loginReq.map(loginReq => {
        println("login request recognized")
        authenticationActor ! loginReq

        true
      })
    }
    case authResp: UserAuthentication => {
      this.authentication = Some(authResp)
      println("auth: " + authResp)
      out ! Encoder[LoginResponseSuccess].apply(new LoginResponseSuccess(authResp.accountType)).spaces2
      context.unbecome()
    }
    case failure: UserAuthenticationFailure.type => {
      out ! Encoder[LoginResponseError].apply(new LoginResponseError()).spaces2
    }
    case unknown@_ => println(s"Unknown message: ${unknown.getClass} $unknown")
  }

  override def postStop(): Unit = {
    // socket closed by client or timeout
  }
}
