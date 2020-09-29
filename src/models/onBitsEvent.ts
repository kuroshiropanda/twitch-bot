import { PubSubBitsMessage } from 'twitch-pubsub-client/lib'

export class onBitsEvent {
  constructor(
    public bit: PubSubBitsMessage
  ) {}
}