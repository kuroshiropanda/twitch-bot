import { HelixClip } from 'twitch/lib'

export class onClipEvent {
  private readonly _data: HelixClip
  constructor(
    public user: string,
    _data: HelixClip
  ) {
    this._data = _data
  }

  get id(): string {
    return this._data.id
  }

  get title(): string {
    return this._data.title
  }

  get broadcasterName(): string {
    return this._data.broadcasterDisplayName
  }

  get creatorName(): string {
    return this._data.creatorDisplayName
  }

  get url(): string {
    return this._data.url
  }

  get thumbnailUrl(): string {
    return this._data.thumbnailUrl.replace('-480x272', '')
  }

  get creationDate(): Date {
    return this._data.creationDate
  }

  async getBroadcaster() {
    return await this._data.getBroadcaster()
  }

  async getGame() {
    return await this._data.getGame()
  }
}