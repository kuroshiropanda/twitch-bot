import { PubSubRedemptionMessage } from '@twurple/pubsub/lib'

export class onRedeemEvent {
  private _data: PubSubRedemptionMessage
  constructor(_data: PubSubRedemptionMessage) {
    this._data = _data
  }

  get id(): string {
    return this._data.id
  }

  get rewardId(): string {
    return this._data.rewardId
  }

  get channel(): string {
    return this._data.channelId
  }

  get rewardName(): string {
    return this._data.rewardTitle
  }

  get user(): string {
    return this._data.userName
  }

  get message(): string {
    return this._data.message
  }
}
