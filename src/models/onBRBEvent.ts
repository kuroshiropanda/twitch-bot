import { HelixClip } from 'twitch/lib'

export class onBRBEvent {
  constructor(
    public type: string,
    public channel: string,
    public clips?: HelixClip[]
  ) {}
}