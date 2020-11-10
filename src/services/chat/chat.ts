import { AuthProvider } from 'twitch-auth'
import { ChatClient, ChatRaidInfo } from 'twitch-chat-client'
import { ChatClientOptions } from 'twitch-chat-client/lib/ChatClient'
import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage'
import { UserNotice } from 'twitch-chat-client/lib/Capabilities/TwitchCommandsCapability/MessageTypes/UserNotice'
import say from 'say'

import { twitch } from '../../config'
import { dance, shoutout, getChatInfo } from '../../common'
import { onBitsEvent, onChatEvent, onRedeemEvent, onSubEvent, toSayEvent, onDonateEvent, onCommandEvent, onClipEvent, onSetGameEvent, onCreateClipEvent, onBRBEvent, onShoutoutEvent } from '../../models'
import { Log } from '../mongo'
import { Event, Events } from '../events'
import { Rewards } from '../pubsub'
import { Commands } from './commands'
import { CommercialLength } from 'twitch/lib'

export default class Chat {

  private chat: ChatClient
  private opts: ChatClientOptions
  private channel: string

  constructor(auth: AuthProvider) {
    this.channel = twitch.channel
    this.opts = {
      webSocket: true,
      channels: [this.channel],
      logger: {
        minLevel: 'INFO'
      }
    }
    this.chat = new ChatClient(auth, this.opts)
  }

  public async init() {
    try {
      await this.chat.connect()
      console.log('Chat Bot: connected', this.channel)
    } catch (err) {
      console.error(err)
    }

    this.chat.onConnect(() => {
      this.chat.action(this.channel, 'chat connected')
    })
    this.chat.onNoPermission((channel: string, msg: string) => this.sendChat('does not have enough permission'))
    this.chat.onMessage((channel: string, user: string, message: string, msg: TwitchPrivateMessage) => this.onChat(channel, user, message, msg))
    this.chat.onRaid((channel: string, user: string, raidInfo: ChatRaidInfo, msg: UserNotice) => this.onRaid(channel, user, raidInfo, msg))
    this.chat.onHosted((channel: string, user: string, auto: boolean, viewers?: number) => this.onHosted(channel, user, auto, viewers))
    this.chat.onTimeout((channel: string, user: string, duration: number) => this.onTimeout(channel, user, duration))

    Event.addListener(Events.onChannelRedeem, (onRedeem: onRedeemEvent) => this.onChannelRedeem(onRedeem))
    Event.addListener(Events.onSub, (onSub: onSubEvent) => this.onSub(onSub))
    Event.addListener(Events.onBits, (onBits: onBitsEvent) => this.onBits(onBits))
    Event.addListener(Events.onDonate, (onDonateEvent: onDonateEvent) => this.onDonate(onDonateEvent))
    Event.addListener(Events.toSay, (toSay: toSayEvent) => this.toSay(toSay))
    Event.addListener(Events.onBRB, (onBRBEvent: onBRBEvent) => this.onBRB(onBRBEvent))
  }

  private async onChat(channel: string, user: string, message: string, msg: TwitchPrivateMessage) {
    if (user === this.chat.currentNick || 'u2san_') return
    if (await this.isBot(msg)) return

    const command = message.toLowerCase().trim()

    if (!command.startsWith('!') && !command.startsWith('https')) {
      this.emit(Events.onChat, new onChatEvent(msg.tags.get('id'), user, msg.parseEmotes(), message, msg.userInfo))
    } else if (command.startsWith('https://clips.twitch.tv') || command.startsWith('https://www.twitch.tv/kuroshiropanda/clip')) {
      this.emit(Events.onClip, new onClipEvent(message))
    } else {
      const split = command.split(' ')
      const args = message.replace(split[0], '').trim()
      switch (split[0]) {
        case Commands.dance:
          this.sendChat('for each sub / 500 bits / $5 donation there would be a random chance for a dance')
          break
        case Commands.changeGame:
          if (split.length > 1 && this.isMod(msg)) {
            this.emit(Events.onSetGame, new onSetGameEvent(args, msg.channelId))
          }
          break
        case Commands.createClip:
          this.emit(Events.onCreateClip, new onCreateClipEvent(msg.channelId))
          break
        case Commands.shoutout:
          if (this.isMod(msg)) {
            shoutout(args)
          }
          break
        case Commands.vanish:
          this.chat.timeout(channel, user, 1, 'vanish command')
          break
        case '!adbreak':
          this.runAd(60)
          break
        default:
          break
      }
    }
  }

  private onRaid(channel: string, user: string, raidInfo: ChatRaidInfo, msg: UserNotice) {
    this.shoutOut(channel, user)
  }

  private onHosted(channel: string, user: string, auto: boolean, viewers?: number) {
    if (!auto) {
      this.shoutOut(channel, user)
    }
  }

  private onTimeout(channel: string, user: string, duration: number) {
    this.chat.say(channel, `${user} was timed out for ${duration}`)
  }

  private emit(event: Events, payload: any) {
    Event.emit(event, payload)
  }

  private shoutOut(channel: string, user: string) {
    this.sendChat(`!so ${user}`)
    shoutout(user)
  }

  private isMod(msg: TwitchPrivateMessage) {
    return msg.userInfo.isMod || msg.userInfo.isBroadcaster
  }

  private async isBot(msg: TwitchPrivateMessage) {
    const info = await getChatInfo(msg.userInfo.userId)
    return info.isAtLeastKnownBot || info.isKnownBot || info.isVerifiedBot
  }

  private gonnaDance(multiplier: number) {
    this.chat.say(this.channel, `${this.channel} will ${dance(multiplier) ? 'dance' : 'not dance'}`)
  }

  private toSay(event: toSayEvent) {
    this.chat.say(this.channel, event.msg)
  }

  private onChannelRedeem(event: onRedeemEvent) {
    switch (event.reward.rewardId) {
      case Rewards.ad:
        this.chat.runCommercial(this.channel, 30)
        break
      case Rewards.shoutOut:
        say.speak(`Shoutout to ${event.reward.userName}`)
        break
      case Rewards.changeTitle:
        this.sendChat(`!settitle ${event.reward.message}`)
        break
      case Rewards.timeout:
        this.chat.timeout(this.channel, event.reward.message, 180, `${event.reward.userDisplayName} redeemed ${event.reward.rewardName}`)
        break
      case Rewards.cancelStop:
        this.sendChat(`thanks to ${event.reward.userName} for cancelling the stop stream reward`)
        break
      case Rewards.emoteOnly:
        this.emoteOnlyReward()
        break
      case Rewards.screenshot:
        this.sendChat(`@${event.reward.userName} screenshot saved on discord you can check it out on the #screenshots channel on discord`)
        break
      default:
        this.chat.say(this.channel, `${event.reward.userName} redeemed ${event.reward.rewardName}`)
        break
    }
  }

  private onSub(event: onSubEvent) {
    let multiplier = Number(event.sub.subPlan === 'Prime' ? 1500 : event.sub.subPlan) / 1000
    this.gonnaDance(multiplier)
  }

  private onBits(event: onBitsEvent) {
    let multiplier = event.bit.bits <= 500 ? 1 : Math.floor(event.bit.bits / 1000)
    if (event.bit.bits >= 500) this.gonnaDance(multiplier)
  }

  private onDonate(event: onDonateEvent) {
    let multiplier = Number(event.donate.message[0].amount) / 10
    if (Number(event.donate.message[0].amount) >= 5) this.gonnaDance(multiplier)
  }

  private onBRB(event: onBRBEvent) {
    if (event.type === 'ad') {
      this.runAd(180)
    }
  }

  private async emoteOnlyReward() {
    await this.chat.enableEmoteOnly(this.channel)

    setTimeout(async () => await this.chat.disableEmoteOnly(this.channel), 120 * 1000)
  }

  private async sendChat(msg: string) {
    this.chat.say(this.channel, msg)
  }

  private async runAd(minutes: CommercialLength) {
    await this.chat.runCommercial(this.channel, minutes)
  }
}