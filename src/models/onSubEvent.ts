import { PubSubSubscriptionMessage } from '@twurple/pubsub/lib'

export class onSubEvent {
  private readonly _data: PubSubSubscriptionMessage
  constructor(_data: PubSubSubscriptionMessage) {
    this._data = _data
  }

  get plan() {
    return this._data.subPlan
  }

  get user() {
    return this._data.userName
  }
}
