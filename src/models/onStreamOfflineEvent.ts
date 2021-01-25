import { EventSubStreamOfflineEvent } from 'twitch-eventsub/lib/Events/EventSubStreamOfflineEvent'
import { HelixUser } from 'twitch/lib'

export class onStreamOfflineEvent {
  private readonly _data: EventSubStreamOfflineEvent
  constructor(_data: EventSubStreamOfflineEvent) {
    this._data = _data
  }

  get broadcasterId(): string {
    return this._data.broadcasterId
  }

  get broadcasterName(): string {
    return this._data.broadcasterName
  }

  get displayName(): string {
    return this._data.broadcasterDisplayName
  }

  get getUser(): Promise<HelixUser> {
    return this._data.getBroadcaster()
  }
}