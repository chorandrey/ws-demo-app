package controllers.actors.entity

import io.circe.{Decoder, Encoder, Json, JsonObject}

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