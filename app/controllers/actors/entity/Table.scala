package controllers.actors.entity

import io.circe._

case class Table(id: Int, name: String, participants: Int)
object Table{
  implicit val encodeTable: Encoder[Table] = (elem) => Json.fromJsonObject(
    JsonObject(
      ("id", Json.fromInt(elem.id)),
      ("name", Json.fromString(elem.name)),
      ("participants", Json.fromInt(elem.participants))
    )
  )

  implicit val decodeTable: Decoder[Table] = (json) => for{
    id <- json.downField("id").as[Option[Int]]
    name <- json.downField("name").as[String]
    participants <- json.downField("participants").as[Int]
  } yield Table(id.getOrElse(-1), name, participants)
}

class SubscribeTables
object SubscribeTables{
  implicit val decode: Decoder[SubscribeTables] = (json) => for{
    tpe <- json.downField("$type").as[String]
  } yield new SubscribeTables
}

class UnsubscribeTables
object UnsubscribeTables{
  implicit val decode: Decoder[UnsubscribeTables] = (json) => for{
    tpe <- json.downField("$type").as[String]
  } yield new UnsubscribeTables
}

case class TableList(tables: List[Table])
object TableList {
  implicit val encode: Encoder[TableList] = (table) => Json.fromJsonObject(
    JsonObject(
      ("$type", Json.fromString("table_list")),
      ("tables", Json.arr(table.tables.map(elem => Encoder[Table].apply(elem)): _*)
      )
    ))
}

/** Server message to notify client that it has no permission to perform operation */
class NotAuthorized
object NotAuthorized{
  implicit val encode: Encoder[NotAuthorized] = (obj) => Json.fromJsonObject(JsonObject.apply(("$type", Json.fromString("not_authorized"))))
}

/** Client command */
case class AddTable(table: Table, afterId: Int)
object AddTable{
  implicit val decode: Decoder[AddTable] = (hCursor) => for{
    tpe <- hCursor.downField("$type").as[String]
    after <- hCursor.downField("after_id").as[Int]
    table <- hCursor.downField("table").as[Table]
  } yield AddTable(table, after)
}

/** Client command */
case class UpdateTable(table: Table)
object UpdateTable{
  implicit val decode: Decoder[UpdateTable] = (hCursor) => for{
    tpe <- hCursor.downField("$type").as[String]
    table <- hCursor.downField("table").as[Table]
  } yield UpdateTable(table)
}

/** Client command */
case class RemoveTable(id: Int)
object RemoveTable{
  implicit val decode: Decoder[RemoveTable] = (hCursor) => for{
    tpe <- hCursor.downField("$type").as[String]
    id <- hCursor.downField("id").as[Int]
  } yield RemoveTable(id)
}

/** Server message to notify client about update*/
class RemovalFailed(val id: Int)
object RemovalFailed{
  implicit val encode: Encoder[RemovalFailed] = (obj) => Json.fromFields(
    List(
      ("$type", Json.fromString("removal_failed")),
      ("id", Json.fromInt(obj.id))
    )
  )
}

/** Server message to notify client about update*/
class UpdateFailed(val id: Int)
object UpdateFailed{
  implicit val encode: Encoder[UpdateFailed] = (obj) => Json.fromFields(
    List(
      ("$type", Json.fromString("update_failed")),
      ("id", Json.fromInt(obj.id))
    )
  )
}

/** Server message to notify client about update*/
case class UpdateTableAdded(table: Table, after_id: Int)
object UpdateTableAdded{
  val encode: Encoder[UpdateTableAdded] = (table) => Json.fromFields(List(
      ("$type", Json.fromString("table_added")),
      ("after_id", Json.fromInt(table.after_id)),
      ("table", Encoder[Table].apply(table.table))
    )
  )
}

/** Server message to notify client about update*/
case class UpdateTableRemoved(id: Int)
object UpdateTableRemoved{
  val encode: Encoder[UpdateTableRemoved] = (table) => Json.fromFields(List(
    ("$type", Json.fromString("table_removed")),
    ("id", Json.fromInt(table.id))
  ))
}

/** Server message to notify client about update*/
case class UpdateTableUpdated(table: Table)
object UpdateTableUpdated{
  val encode: Encoder[UpdateTableUpdated] = (table) => Json.fromFields(List(
    ("$type", Json.fromString("table_updated")),
    ("table", Encoder[Table].apply(table.table))
  ))
}
