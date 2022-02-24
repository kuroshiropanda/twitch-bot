import { SceneItemVisibilityChangedData } from '@obs'
import { HelixUpdateCustomRewardData } from '@twurple/api/lib'

export class toUpdateRewardEvent {
  private readonly _data: SceneItemVisibilityChangedData
  constructor(
    _data: SceneItemVisibilityChangedData,
    public rewardId: string[],
    public data: HelixUpdateCustomRewardData
  ) {
    this._data = _data
  }

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
