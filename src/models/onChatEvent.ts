import { ChatUser, ParsedMessagePart } from 'twitch-chat-client/lib'
import { promises as fs } from 'fs'

export class onChatEvent {
  constructor(
    public id: string,
    public user: string,
    public emotes: ParsedMessagePart[],
    public message: string,
    public userInfo: ChatUser
  ) {
  }

  async badge(): Promise<string> {
    const json = JSON.parse(await fs.readFile('badges.json', { encoding: 'utf-8' }))
    for (const [key, value] of Object.entries(json)) {
      if (this.userInfo.badges.has(key)) {
        return String(value)
      }
    }

    return ''
  }
}