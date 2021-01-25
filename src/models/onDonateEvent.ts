import { donateData } from '../services/streamlabs'

export class onDonateEvent {
  private readonly _data: donateData
  constructor(
    _data: donateData
  ) {}

  get amount() {
    return this._data.message[0].amount
  }

  get user() {
    return this._data.message[0].name
  }

  get message() {
    return this._data.message[0].message
  }
}