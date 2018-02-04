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
              val subscribeTables = getObject[SubscribeTables](json)
              subscribeTables.foreach(tablesReq => tablesActor ! tablesReq)
            case "unsubscribe_tables" =>
              val unsubscribeTables = getObject[UnsubscribeTables](json)
              unsubscribeTables.foreach(elem => tablesActor ! elem)
            case "add_table" if isAdmin =>
              val addTable = getObject[AddTable](json)
              addTable.foreach(elem => tablesActor ! elem)
            case "add_table" => out ! stringify(new NotAuthorized)
            case "update_table" if isAdmin =>
              val updateTable = getObject[UpdateTable](json)
              updateTable.foreach(elem => tablesActor ! elem)
            case "update_table" => out ! stringify(new NotAuthorized)
            case "remove_table" if isAdmin =>
              val removeTable = getObject[RemoveTable](json)
              removeTable.foreach(elem => tablesActor ! elem)
            case "remove_table" => out ! stringify(new NotAuthorized)
            case "ping" =>
              val pingRequest = getObject[PingRequest](json)
              pingRequest.foreach(req => out ! stringify(req.resp))
            case elem @ _ => logger.warn("Unexpected message in actor: " + elem)
          })
        }
      }
    }

    case tableList: TableList => out ! stringify(tableList)

    case removalFailed: RemovalFailed => out ! stringify(removalFailed)
    case updateFailed: UpdateFailed => out ! stringify(updateFailed)

    case updateTableAdded: UpdateTableAdded => out ! stringify(updateTableAdded)
    case updateTableUpdated: UpdateTableUpdated => out ! stringify(updateTableUpdated)
    case updateTableRemoved: UpdateTableRemoved => out ! stringify(updateTableRemoved)
  }

  def unathenticated: Receive = {
    case msg: String => {
      parse(msg) match {
        case Left(err) =>
          val errStr = "parsing failure: " + err.getMessage()
          logger.error(errStr)
          out ! stringify(new WSError(errStr))
        case Right(json) =>
          val reqType = json.hcursor.downField("$type").as[String].toOption
          reqType match {
            case Some("login") =>
              val loginReq = getObject[LoginRequest](json)
              loginReq match {
                case Some(loginRequest) => authenticationActor ! loginRequest
                case None => out ! stringify(new LoginResponseError())
              }
              authenticationActor ! loginReq
            case Some("ping") =>
              val pingRequest = getObject[PingRequest](json)
              pingRequest match {
                case Some(pingReq) => out ! stringify(pingReq.resp)
                case None => out ! stringify(new WSError("Illegal ping request entity"))
              }
            case _ => out ! stringify(new LoginResponseError())
          }
      }
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

  def isAdmin: Boolean = this.authentication.exists(_.accountType == AccountType.admin)
}
