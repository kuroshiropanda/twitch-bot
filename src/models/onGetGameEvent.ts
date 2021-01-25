export class onGetGameEvent {
  private _channel: string
  constructor(
    _channel: string,
    public channelId: string,
    public user: string
  ) {
    this._channel = _channel
  }

  get channel() {
    return this._channel.replace('#', '')
  }
}