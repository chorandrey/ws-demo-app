package controllers.actors

import akka.actor.{Actor, ActorRef}
import controllers.actors.entity._
import play.api.Logger
import scala.annotation.{switch, tailrec}
import TableHolderActor.findIndexToPrepend

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
      (afterId: @switch) match {
        // add before list: if there is space between 0 and last element - it will be
        // inserted on a first empty place and to the end of the table otherwise
        // but for me it's strange decision to insert elements to collection start
        case -1 =>
          val newIndex: Int = findIndexToPrepend(this.tables)
          val insertTable = table.copy(id = newIndex)
          //TODO insert to tables
        // add to the end of list
        case _ =>
      }
    //possible responses: update_failed (if no such table with id), table_updated
    case UpdateTable(table) =>

    //possible responses: removal_failed (if no such table with id), table_removed
    case RemoveTable =>

    case elem @ _ => context.system.deadLetters ! elem
  }
}

object TableHolderActor{
  @tailrec def findIndexToPrepend(tableElems: List[Table], currentElem: Int = 0): Int = {
    if(tableElems.isEmpty) currentElem
    else {
      val headElem = tableElems.head
      if(currentElem != headElem.id) currentElem
      else findIndexToPrepend(tableElems.tail, currentElem + 1)
    }
  }
}
