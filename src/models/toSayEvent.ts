import { TwitchPrivateMessage } from '@twurple/chat/lib/commands/TwitchPrivateMessage'

export class toSayEvent {
  constructor(
    public msg: string,
    public privateMsg?: string | TwitchPrivateMessage
  ) {}
}
