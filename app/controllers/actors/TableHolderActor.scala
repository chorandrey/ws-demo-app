package controllers.actors

import akka.actor.{Actor, ActorRef}
import controllers.actors.entity._
import play.api.Logger

class TableHolderActor extends Actor{
  val logger = Logger("play").logger
  var tables: List[Table] = List(
    Table(1, "table - James Bond", 7),
    Table(2, "table - Mission Impossible", 4)
  )
  var subscribers: Set[ActorRef] = Set.empty

  override def receive: Receive = {
    case subscribe_tables: SubscribeTables => {
      logger.debug("Table list received subscribe request")
      this.subscribers = subscribers + sender()
      sender() ! TableList(tables)
    }
    case unsubscribe: UnsubscribeTables => {
      logger.info("Table list received unsubscribe request")
      val ref = sender()
      subscribers = subscribers - ref
    }

    //possible responses: table_added
    case AddTable(table, afterId) =>

    //possible responses: update_failed (if no such table with id), table_updated
    case UpdateTable(table) =>

    //possible responses: removal_failed (if no such table with id), table_removed
    case RemoveTable =>

    case elem @ _ => context.system.deadLetters ! elem
  }
}
