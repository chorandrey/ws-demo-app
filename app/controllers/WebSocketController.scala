package controllers

import javax.inject._

import akka.actor.ActorSystem
import akka.stream.Materializer
import controllers.actors.{ApplicationActor, PingWebSocketActor}
import play.api.mvc._
import play.api.libs.streams.ActorFlow
import services.ActorServices

@Singleton
class WebSocketController @Inject()(cc: ControllerComponents, actorServices: ActorServices)(implicit system: ActorSystem, mat: Materializer) extends AbstractController(cc) {

  def ping: WebSocket = WebSocket.accept[String, String] { request =>
    ActorFlow.actorRef { out =>
      PingWebSocketActor.props(out)
    }
  }

  def application: WebSocket = WebSocket.accept[String, String] { request =>
    ActorFlow.actorRef { out =>
      ApplicationActor.props(out, actorServices.authentication)
    }
  }

}
