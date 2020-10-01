import { donateData } from '../services/streamlabs'

export class onDonateEvent {
  constructor(
    public donate: donateData
  ) {}
}