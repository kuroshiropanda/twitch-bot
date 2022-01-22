import { ChatUser } from '@twurple/chat/lib'
import { ParsedMessagePart } from '@twurple/common/lib'

export class onChatEvent {
  constructor(
    public id: string | undefined,
    public user: string,
    public emotes: ParsedMessagePart[],
    public message: string,
    public userInfo: ChatUser
  ) {}
}
