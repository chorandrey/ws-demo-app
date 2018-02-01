package controllers.actors.entity

import io.circe.Decoder.Result
import io.circe._
import sun.security.krb5.internal.SeqNumber

case class PingRequest(seqNumber: Int){
  def resp = PingResponse(seqNumber + 1)
}

object PingRequest {
  implicit val decodePing: Decoder[PingRequest] = new Decoder[PingRequest] {
    override def apply(c: HCursor): Result[PingRequest] = for {
      tpe <- c.downField("$type").as[String]
      seq <- c.downField("seq").as[Int]
    } yield PingRequest(seq)
  }
}

case class PingResponse(seqNumber: Int)
object PingResponse{
  implicit val encodePingResp: Encoder[PingResponse] = new Encoder[PingResponse] {
    override final def apply(a: PingResponse): Json = Json.obj(
      ("$type", Json.fromString("pong")),
      ("seq", Json.fromInt(a.seqNumber))
    )
  }
}

object Ping


