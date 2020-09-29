import { ParsedMessagePart } from "twitch-chat-client/lib";

export class onChatEvent {
  constructor(
    public id: string,
    public user: string,
    public emotes: ParsedMessagePart[],
    public message: string
  ) {}
}