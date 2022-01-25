import { twitch } from '@config'
import { Event, Events } from '@events'
import { onBitsEvent, onRedeemEvent, onSubEvent } from '@models'
import { AuthProvider } from '@twurple/auth/lib'
import { UserIdResolvable } from '@twurple/common/lib'
import {
  PubSubBitsMessage,
  PubSubClient,
  PubSubRedemptionMessage,
  PubSubSubscriptionMessage,
} from '@twurple/pubsub'

export class PubSub {
  private auth: AuthProvider
  private pubsub: PubSubClient
  private channel: UserIdResolvable

  constructor(auth: AuthProvider, channel: UserIdResolvable) {
    this.auth = auth
    this.pubsub = new PubSubClient()
    this.channel = channel
  }

  public async init() {
    const reg = await this.pubsub.registerUserListener(this.auth)
    console.log('PubSub:', reg)

    this.pubsub.onRedemption(this.channel, (msg: PubSubRedemptionMessage) =>
      this.onRedeem(msg)
    )
    this.pubsub.onSubscription(this.channel, (msg: PubSubSubscriptionMessage) =>
      this.onSub(msg)
    )
    this.pubsub.onBits(this.channel, (msg: PubSubBitsMessage) =>
      this.onBits(msg)
    )
  }

  private emit(event: Events, payload: any) {
    Event.emit(event, payload)
  }

  private onRedeem(msg: PubSubRedemptionMessage) {
    this.emit(Events.onChannelRedeem, new onRedeemEvent(msg))
  }

  private onSub(msg: PubSubSubscriptionMessage) {
    this.emit(Events.onSub, new onSubEvent(msg))
  }

  private onBits(msg: PubSubBitsMessage) {
    this.emit(Events.onBits, new onBitsEvent(msg))
  }
}
