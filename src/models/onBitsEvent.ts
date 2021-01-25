import { PubSubBitsMessage } from 'twitch-pubsub-client/lib'

export class onBitsEvent {
  private readonly _data: PubSubBitsMessage
  constructor(_data: PubSubBitsMessage) {
    this._data = _data
  }

  get bits() {
    return this._data.bits
  }

  get user() {
    return this._data.userName
  }

  get message() {
    return this._data.message
  }
}