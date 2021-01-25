import {
  HelixPaginatedResult,
  HelixStream,
  HelixSubscription,
  HelixUser,
  HelixGame,
  HelixTag
} from 'twitch/lib'

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
    return this._subs.data.length - 2
  }

  get title() {
    return this._data.title
  }

  get thumbnail() {
    return this._data.thumbnailUrl.replace('{width}x{height}', '1280x720')
  }

  get viewers() {
    return this._data.viewers
  }

  get startDate() {
    return this._data.startDate
  }

  async getUser(): Promise<HelixUser> {
    return await this._data.getUser()
  }

  async getGame(): Promise<HelixGame> {
    return await this._data.getGame()
  }

  async getTags(): Promise<HelixTag[]> {
    return await this._data.getTags()
  }
}