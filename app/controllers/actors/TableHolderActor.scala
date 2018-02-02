package controllers.actors

import akka.actor.{Actor, ActorRef}
import controllers.actors.entity._
import play.api.Logger

import scala.annotation.{switch, tailrec}
import TableHolderActor.findIndexToPrepend

import scala.collection.mutable.ListBuffer

class TableHolderActor extends Actor{
  val logger = Logger("play").logger
  import TableHolderActor.comparator
  var tables: ListBuffer[Table] = ListBuffer(
    Table(1, "table - James Bond", 7),
    Table(2, "table - Mission Impossible", 4),
    Table(3, "table - Assassin's creed", 2)
  )
  var subscribers: Set[ActorRef] = Set.empty

  override def receive: Receive = {
    case subscribe_tables: SubscribeTables => {
      this.subscribers = subscribers + sender()
      sender() ! TableList(tables.toList)
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
        case -1 =>
          //TODO not so reliable solution
          val newIndex: Int = findIndexToPrepend(this.tables)
          val insertTable = table.copy(id = newIndex)
          this.tables.insert(newIndex, insertTable)
          sender() ! UpdateTableAdded(table, afterId)
        case _ =>
          this.tables += table.copy(id = tables.max.id + 1)
          sender() ! UpdateTableAdded(table, afterId)
      }

    //possible responses: update_failed (if no such table with id), table_updated
    case UpdateTable(table) if !canUpdate(table) =>
      logger.error("update table failed: " + table.toString)
      sender() ! new UpdateFailed(table.id)
    case UpdateTable(table) =>
      val updateIndex = tables.indexWhere(elem => elem.id == table.id)
      (updateIndex: @switch) match {
        case index if index >= 0 =>
          this.tables.update(index, table)
          subscribers.foreach(subscriber => subscriber ! UpdateTableUpdated(table))
        case _ => logger.error(s"Couldn't update table : $table because no such elements found with id specified")
      }

    //possible responses: removal_failed (if no such table with id), table_removed
    case RemoveTable(id) if !canUpdate(id)=> sender() ! new RemovalFailed(id)
    case RemoveTable(id) =>
      val updateIndex = tables.indexWhere(elem => elem.id == id)
      (updateIndex: @switch) match {
        case index if index >= 0 =>
          this.tables.remove(index)
          subscribers.foreach(subscriber => subscriber ! UpdateTableRemoved(id))
        case index => logger.error(s"Couldn't update table with id $id because no such elements found with id specified")
      }
    case elem @ _ => context.system.deadLetters ! elem
  }

  def canUpdate(updateTable: Table): Boolean = if(this.tables.exists(elem => elem.id == updateTable.id)) true else false
  def canUpdate(id: Int): Boolean = if(this.tables.exists(elem => elem.id == id)) true else false

}

object TableHolderActor{
  implicit val comparator: Ordering[Table] = (x , y) => x.id - y.id

  @tailrec def findIndexToPrepend(tableElems: Seq[Table], currentElem: Int = 0): Int = {
    if(tableElems.isEmpty) currentElem
    else {
      val headElem = tableElems.head
      if(currentElem != headElem.id) currentElem
      else findIndexToPrepend(tableElems.tail, currentElem + 1)
    }
  }
}
