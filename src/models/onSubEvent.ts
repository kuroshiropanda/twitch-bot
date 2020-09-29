import { PubSubSubscriptionMessage } from 'twitch-pubsub-client/lib'

export class onSubEvent {
  constructor(
    public sub: PubSubSubscriptionMessage
  ) { }
}