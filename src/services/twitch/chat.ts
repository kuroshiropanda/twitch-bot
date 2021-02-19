import { AuthProvider } from 'twitch-auth'
import { ChatClient, ChatRaidInfo } from 'twitch-chat-client'
import { CommercialLength, HelixCustomRewardRedemptionTargetStatus } from 'twitch/lib'
import { ChatClientOptions } from 'twitch-chat-client/lib/ChatClient'
import { PrivateMessage, UserNotice } from 'twitch-chat-client/lib'

import { Commands } from './commands'

import { twitch } from '@config'
import { dance, shoutout, getChatInfo, getChannelName } from 'common'
import { Event, Events } from '@events'
import { Rewards } from './rewards'
import {
  onBitsEvent,
  onChatEvent,
  onRedeemEvent,
  onSubEvent,
  toSayEvent,
  onDonateEvent,
  onPostClipEvent,
  onSetGameEvent,
  onCreateClipEvent,
  onBRBEvent,
  onRewardCompleteEvent,
  onGetGameEvent
} from '@models'
import { Logger } from '@logger'

export class Chat {

  private chat: ChatClient
  private opts: ChatClientOptions
  private channel: string

  constructor(auth: AuthProvider) {
    this.channel = twitch.channel
    this.opts = {
      webSocket: true,
      channels: [this.channel],
      logger: {
        name: 'chat',
        minLevel: 'INFO',
        colors: true,
        emoji: true,
        timestamps: true
      }
    }
    this.chat = new ChatClient(auth,
      this.opts)
  }

  public async init() {
    await this.chat.connect()

    this.chat.onRegister(() => this.chat.action(this.channel, 'chat connected'))
    this.chat.onMessage((channel: string, user: string, message: string, msg: PrivateMessage) => this.onChat(channel, user, message, msg))
    this.chat.onRaid((channel: string, user: string, raidInfo: ChatRaidInfo, msg: UserNotice) => this.onRaid(channel, user, raidInfo, msg))
    this.chat.onHosted((channel: string, user: string, auto: boolean, viewers?: number) => this.onHosted(channel, user, auto, viewers))
    this.chat.onTimeout((channel: string, user: string, duration: number) => this.onTimeout(channel, user, duration))

    Event.addListener(Events.onChannelRedeem, (data: onRedeemEvent) => this.onChannelRedeem(data))
    Event.addListener(Events.onSub, (data: onSubEvent) => this.onSub(data))
    Event.addListener(Events.onBits, (data: onBitsEvent) => this.onBits(data))
    Event.addListener(Events.onDonate, (data: onDonateEvent) => this.onDonate(data))
    Event.addListener(Events.toSay, (data: toSayEvent) => this.toSay(data))
    Event.addListener(Events.onBRB, (data: onBRBEvent) => this.onBRB(data))
  }

  private async onChat(channel: string, user: string, message: string, msg: PrivateMessage) {
    if (await this.isBot(msg)) return

    const trimmed = message.toLowerCase().trim()

    if (!trimmed.startsWith('!') && !trimmed.startsWith('https')) {
      this.emit(Events.onChat, new onChatEvent(msg.tags.get('id'), user, msg.parseEmotes(), message, msg.userInfo))
    } else if (trimmed.startsWith('https://clips.twitch.tv')) {
      this.emit(Events.onPostClip, new onPostClipEvent(user, message.replace('https://clips.twitch.tv/', '')))
    } else {
      const [command, ...args] = trimmed.split(' ')
      switch (command) {
        case Commands.dance:
          this.chat.say(channel, 'for every $5 I\'ll do a dance that you want')
          break
        case Commands.hypetrain:
          this.chat.say(channel, 'for each hype train level top contributors has the power to make me do dares/dance (I\'m not obliged to do the dares meaning I might decline on doing it)')
          break
        case Commands.spoiler:
          this.chat.deleteMessage(channel, msg).catch((reason) => console.error(reason))
          this.sendChat(`${ user } used the !spoiler command be careful when clicking on the deleted message if you don't want to be spoiled`)
          break
        case Commands.changeGame:
          if (args.length >= 1 && this.isMod(msg)) {
            this.emit(Events.onSetGame, new onSetGameEvent(args.join(' '), msg.channelId))
          } else {
            this.emit(Events.onGetGame, new onGetGameEvent(channel, msg.channelId, user))
          }
          break
        case Commands.createClip:
          this.emit(Events.onCreateClip, new onCreateClipEvent(user, msg.channelId))
          break
        case Commands.shoutout:
          if (this.isMod(msg)) {
            shoutout(args[0])
          }
          break
        case Commands.vanish:
          this.chat.timeout(channel, user, 1, 'vanish command')
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
    this.chat.say(channel, `${ user } was timed out for ${ duration }`)
  }

  private emit(event: Events, payload: any) {
    Event.emit(event, payload)
  }

  private shoutOut(channel: string, user: string) {
    this.sendChat(`!so ${ user }`)
    shoutout(user)
  }

  private isMod(msg: PrivateMessage) {
    return msg.userInfo.isMod || msg.userInfo.isBroadcaster
  }

  private async isBot(msg: PrivateMessage) {
    const info = await getChatInfo(msg.userInfo.userId)
    const u2san = msg.userInfo.userName === 'u2san_'
    const self = this.chat.currentNick === msg.userInfo.userName
    return info.isAtLeastKnownBot || info.isKnownBot || info.isVerifiedBot || u2san || self
  }

  private gonnaDance(multiplier: number) {
    this.chat.say(this.channel, `${ this.channel } will ${ dance(multiplier) ? 'dance' : 'not dance' }`)
  }

  private toSay(event: toSayEvent) {
    this.chat.say(this.channel, event.msg)
  }

  private onChannelRedeem(redeem: onRedeemEvent) {
    switch (redeem.rewardId) {
      case Rewards.ad:
        this.runAd(30, redeem)
        break
      case Rewards.changeTitle:
        this.sendChat(`!settitle ${ redeem.message }`, redeem)
        break
      case Rewards.timeout:
        this.timeoutUser(redeem)
        break
      case Rewards.cancelStop:
        this.sendChat(`thanks to ${ redeem.user } for cancelling the stop stream reward`)
        break
      case Rewards.emoteOnly:
        this.emoteOnlyReward(redeem)
        break
      case Rewards.screenshot:
        this.sendChat(`@${ redeem.user } screenshot saved on discord you can check it out on the #screenshots channel on discord`)
        break
      default:
        this.sendChat(`${ redeem.user } redeemed ${ redeem.rewardName }`)
        break
    }
  }

  private onSub(sub: onSubEvent) {
    const multiplier = Number(sub.plan === 'Prime' ? 1500 : sub.plan) / 1000
    this.gonnaDance(multiplier)
  }

  private onBits(cheer: onBitsEvent) {
    const multiplier = cheer.bits <= 500 ? 1 : Math.floor(cheer.bits / 1000)
    if (cheer.bits >= 500) this.gonnaDance(multiplier)
  }

  private onDonate(tip: onDonateEvent) {
    const multiplier = Number(tip.amount) / 10
    if (Number(tip.amount) >= 5) this.gonnaDance(multiplier)
  }

  private onBRB(event: onBRBEvent) {
    if (event.type === 'ad') {
      this.runAd(180)
    }
  }

  private async emoteOnlyReward(data: onRedeemEvent) {
    const channel = await getChannelName(data.channel)
    await this.chat.enableEmoteOnly(channel)

    setTimeout(async () => {
      await this.chat.disableEmoteOnly(channel)
      this.rewardComplete(data.channel, data.rewardId, data.id, 'FULFILLED')
    }, 120 * 1000)
  }

  private async sendChat(msg: string, event?: onRedeemEvent) {
    let complete: HelixCustomRewardRedemptionTargetStatus
    try {
      await this.chat.say(this.channel, msg)
      complete = 'FULFILLED'
    } catch (e) {
      new Logger(e, 'error')
      complete = 'CANCELED'
    }

    if (event) this.rewardComplete(event.channel, event.rewardId, event.id, complete)
  }

  private async runAd(minutes: CommercialLength, event?: onRedeemEvent) {
    let complete: HelixCustomRewardRedemptionTargetStatus
    try {
      await this.chat.runCommercial(this.channel, minutes)
      complete = 'FULFILLED'
    } catch (e) {
      new Logger(e, 'error')
      complete = 'CANCELED'
    }

    if (event) this.rewardComplete(event.channel, event.rewardId, event.id, complete)
  }

  private async timeoutUser(timeout: onRedeemEvent) {
    let complete: HelixCustomRewardRedemptionTargetStatus
    try {
      await this.chat.timeout(timeout.channel, timeout.message, 180, `${ timeout.user } redeemed ${ timeout.rewardName }`)
      complete = 'FULFILLED'
    } catch (e) {
      new Logger(e, 'error')
      complete = 'CANCELED'
    }

    this.rewardComplete(timeout.channel, timeout.rewardId, timeout.id, complete)
  }

  private rewardComplete(channelId: string, rewardId: string, redemptionId: string, complete: HelixCustomRewardRedemptionTargetStatus) {
    this.emit(Events.onRewardComplete, new onRewardCompleteEvent(channelId, rewardId, redemptionId, complete))
  }
}