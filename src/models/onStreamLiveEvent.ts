import { EventSubStreamOnlineEvent } from 'twitch-eventsub/lib/Events/EventSubStreamOnlineEvent'

export class onStreamLiveEvent {
  private readonly _data: EventSubStreamOnlineEvent
  constructor(_data: EventSubStreamOnlineEvent) {
    this._data = _data
  }

  get broadcasterId() {
    return this._data.broadcasterId
  }

  get broadcasterName() {
    return this._data.broadcasterName
  }

  get displayName() {
    return this._data.broadcasterDisplayName
  }

  get type() {
    return this._data.streamType
  }
}