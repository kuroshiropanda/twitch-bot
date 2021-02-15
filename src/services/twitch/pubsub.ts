import { ApiClient } from 'twitch'
import { PubSubBitsMessage, PubSubClient, PubSubRedemptionMessage, PubSubSubscriptionMessage } from 'twitch-pubsub-client'

import { twitch } from '@config'
import { Event, Events } from '@events'
import {
  onRedeemEvent,
  onSubEvent,
  onBitsEvent
} from '@models'

export class PubSub {

  private api: ApiClient
  private pubsub: PubSubClient
  private channel: string

  constructor(api: ApiClient) {
    this.api = api
    this.pubsub = new PubSubClient()
    this.channel = twitch.channel
  }

  public async init() {
    const reg = await this.pubsub.registerUserListener(this.api, this.channel)
    console.log('PubSub:', reg)

    this.pubsub.onRedemption(this.channel, (msg: PubSubRedemptionMessage) => this.onRedeem(msg))
    this.pubsub.onSubscription(this.channel, (msg: PubSubSubscriptionMessage) => this.onSub(msg))
    this.pubsub.onBits(this.channel, (msg: PubSubBitsMessage) => this.onBits(msg))
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