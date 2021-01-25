import { PubSubSubscriptionMessage } from 'twitch-pubsub-client/lib'

export class onSubEvent {
  private readonly _data: PubSubSubscriptionMessage
  constructor(
    _data: PubSubSubscriptionMessage
  ) {}

  get plan() {
    return this._data.subPlan
  }

  get user() {
    return this._data.userName
  }
}