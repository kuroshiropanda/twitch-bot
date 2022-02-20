import { PrivateMessage } from '@twurple/chat/lib'

export class onGetGameEvent {
  private _channel: string
  private _data: PrivateMessage

  constructor(
    _channel: string,
    public user: string,
    data: PrivateMessage
  ) {
    this._channel = _channel
    this._data = data
  }

  get channel() {
    return this._channel.replace('#', '')
  }

  get channelId() {
    return this._data.channelId
  }

  get userName() {
    return this._data.userInfo.userName
  }

  get privateMsg() {
    return this._data
  }
}
