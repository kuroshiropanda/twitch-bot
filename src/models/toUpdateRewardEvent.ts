import { HelixUpdateCustomRewardData } from 'twitch/lib'
import { SceneItemVisibilityChangedData } from '../services/obs'

export class toUpdateRewardEvent {
  private readonly _data: SceneItemVisibilityChangedData
  constructor(
    _data: SceneItemVisibilityChangedData,
    public user: string,
    public rewardId: string[],
    public data: HelixUpdateCustomRewardData
  ) {}

  get scene() {
    return this._data['scene-name']
  }

  get source() {
    return this._data['item-name']
  }

  get visibility() {
    return this._data['item-visible']
  }
}