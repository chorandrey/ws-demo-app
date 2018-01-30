package controllers

import javax.inject._

import akka.actor.ActorSystem
import akka.stream.Materializer
import controllers.actors.PingWebSocketActor
import play.api.mvc._
import play.api.libs.streams.ActorFlow

@Singleton
class WebSocketController @Inject()(cc: ControllerComponents)(implicit system: ActorSystem, mat: Materializer) extends AbstractController(cc) {

  /**
   * Create an Action to render an HTML page with a welcome message.
   * The configuration in the `routes` file means that this method
   * will be called when the application receives a `GET` request with
   * a path of `/`.
   */

  def ping: WebSocket = WebSocket.accept[String, String] { request =>
    ActorFlow.actorRef { out =>
      PingWebSocketActor.props(out)
    }
  }

}
