import { PubSubRedemptionMessage } from 'twitch-pubsub-client/lib'

export class onRedeemEvent {
  constructor(
    public reward: PubSubRedemptionMessage
  ) {}
}