import { PrivateMessage } from "@twurple/chat/lib";

export class onCreateClipEvent {
  private _data: PrivateMessage

  constructor(
    data: PrivateMessage
  ) {
    this._data = data
  }

  get channelId() {
    return this._data.channelId
  }

  get user() {
    return this._data.userInfo.userName
  }

  get privateMsg() {
    return this._data
  }
}
