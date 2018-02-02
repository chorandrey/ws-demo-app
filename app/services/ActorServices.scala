package services

import javax.inject.{Inject, Singleton}

import akka.actor.{ActorRef, ActorSystem, Props}
import controllers.actors.entity.NameBasedUserAuthentication
import controllers.actors.{AuhtenticationActor, TableHolderActor}

@Singleton
class ActorServices @Inject()(val system: ActorSystem) {
  val authentication: ActorRef = system.actorOf(AuhtenticationActor.props(new NameBasedUserAuthentication()))
  val tableHolder: ActorRef = system.actorOf(Props[TableHolderActor])
}
