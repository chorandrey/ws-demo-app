package controllers.actors

import akka.actor._
import controllers.actors.entity._
import io.circe._
import io.circe.parser._
import play.api.Logger

object ApplicationActor{
  def props(out: ActorRef, authenticationActor: ActorRef, tablesActor: ActorRef) = Props(new ApplicationActor(out, authenticationActor, tablesActor))
}

class ApplicationActor(out: ActorRef, authenticationActor: ActorRef, tablesActor: ActorRef) extends Actor {
  val logger = Logger("play").logger

  var authentication: Option[UserAuthentication] = None

  context.become(unathenticated) //workflow for not-authenticated clients

  // for authenticated clients
  override def receive: Receive = {
    case msg: String => {
      parse(msg) match {
        case Left(err) =>
          val errStr = "parsing failure: " + err.getMessage()
          logger.error(errStr)
          out ! stringify(new WSError(errStr))

        case Right(json) => {
          // determine type of object
          val objectType = json.hcursor.downField("$type").as[String].toOption
          objectType.foreach({
            case "subscribe_tables" =>
              println("subscribe_tables block")
              val subscribeTables = getObject[SubscribeTables](json)
              subscribeTables.foreach(tablesReq => tablesActor ! tablesReq)
            case "unsubscribe_tables" =>
              val unsubscribeTables = getObject[UnsubscribeTables](json)
              unsubscribeTables.foreach(elem => tablesActor ! elem)
            case _ => {}
          })
        }
      }
    }

    case tableList: TableList => out ! stringify(tableList)

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
      logger.info("New user logged in: " + authentication.get.user)
      context.unbecome()
    }
    case failure: LoginResponseError => out ! stringify(failure)
    case unknown@_ => context.system.deadLetters ! unknown
  }

  override def postStop(): Unit = {
    // socket closed by client or timeout
    tablesActor ! new UnsubscribeTables()
  }

  def getObject[T](elem: Json)(implicit decoder: Decoder[T]): Option[T] = decoder.decodeJson(elem).toOption
  def stringify[T](entity: T)(implicit encoder: Encoder[T]): String = encoder.apply(entity).spaces2
}
