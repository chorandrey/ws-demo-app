package services

import javax.inject.{Inject, Singleton}

import akka.actor.{ActorRef, ActorSystem, Props}
import controllers.actors.entity.NameBasedUserAuthentication
import controllers.actors.AuhtenticationActor

@Singleton
class ActorServices @Inject()(val system: ActorSystem) {
  val authentication: ActorRef = system.actorOf(AuhtenticationActor.props(new NameBasedUserAuthentication()))
}
