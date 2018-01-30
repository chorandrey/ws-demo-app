package controllers.actors

import akka.actor._
import controllers.actors.entity.{PingRequest, PingResponse}
import io.circe._
import io.circe.parser._

object PingWebSocketActor {
  def props(out: ActorRef) = Props(new PingWebSocketActor(out))
}

class PingWebSocketActor(out: ActorRef) extends Actor {
  import PingResponse._
  def receive: Receive = {
    case msg: String => {
      parse(msg) match {
        case Left(err) => {
          val errStr = "parsing failure: " + err.getMessage()
          println(errStr)
          out ! errStr
        }
        case Right(json) => {
          json.as[PingRequest] match {
            case Left(err) => {
              println(err)
              out ! err.message
            }
            case Right(pingr) => out ! Encoder[PingResponse].apply(pingr.resp).spaces2
          }
        }
      }


    }

  }

  override def postStop(): Unit = {
    // socket closed by client
  }
}
