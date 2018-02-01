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
    id <- json.downField("id").as[Int]
    name <- json.downField("name").as[String]
    participants <- json.downField("participants").as[Int]
  } yield Table(id, name, participants)
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

class NotAuthorized
object NotAuthorized{
  implicit val encode: Encoder[NotAuthorized] = (obj) => Json.fromJsonObject(JsonObject.apply(("$type", Json.fromString("not_authorized"))))
}

case class AddTable(table: Table, afterId: Int)
object AddTable{
  implicit val decode: Decoder[AddTable] = (hCursor) => for{
    tpe <- hCursor.downField("$type").as[String]
    after <- hCursor.downField("after_id").as[Int]
    table <- hCursor.downField("table").as[Table]
  } yield AddTable(table, after)
}

case class UpdateTable(table: Table)
object UpdateTable{
  implicit val decode: Decoder[UpdateTable] = (hCursor) => for{
    tpe <- hCursor.downField("$type").as[String]
    table <- hCursor.downField("table").as[Table]
  } yield UpdateTable(table)
}

case class RemoveTable(id: Int)
object RemoveTable{
  implicit val decode: Decoder[RemoveTable] = (hCursor) => for{
    tpe <- hCursor.downField("$type").as[String]
    id <- hCursor.downField("id").as[Int]
  } yield RemoveTable(id)
}

class RemovalFailed(val id: Int)
object RemovalFailed{
  implicit val encode: Encoder[RemovalFailed] = (obj) => Json.fromFields(
    List(
      ("$type", Json.fromString("removal_failed")),
      ("id", Json.fromInt(obj.id))
    )
  )
}

class UpdateFailed(val id: Int)
object UpdateFailed{
  implicit val encode: Encoder[UpdateFailed] = (obj) => Json.fromFields(
    List(
      ("$type", Json.fromString("update_failed")),
      ("id", Json.fromInt(obj.id))
    )
  )
}

