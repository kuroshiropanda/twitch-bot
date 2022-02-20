import {
  HelixGame,
  HelixPaginatedResult,
  HelixStream,
  HelixSubscription,
  HelixTag,
  HelixUser,
} from '@twurple/api/lib'

export class toPostLiveEvent {
  private readonly _data: HelixStream
  private readonly _subs: HelixPaginatedResult<HelixSubscription>
  constructor(
    _data: HelixStream,
    _subs: HelixPaginatedResult<HelixSubscription>
  ) {
    this._data = _data
    this._subs = _subs
  }

  get totalSubs() {
    return `${this._subs.data.length - 2}`
  }

  get title() {
    return this._data.title
  }

  get thumbnail() {
    return this._data.getThumbnailUrl(1280, 720)
  }

  get viewers() {
    return this._data.viewers
  }

  get startDate() {
    return this._data.startDate
  }

  async getUser(): Promise<HelixUser | null> {
    return await this._data.getUser()
  }

  async getGame(): Promise<HelixGame | null> {
    return await this._data.getGame()
  }

  async getTags(): Promise<HelixTag[]> {
    return await this._data.getTags()
  }
}
