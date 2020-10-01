import { AuthProvider } from 'twitch-auth'
import { ChatClient, ChatRaidInfo } from 'twitch-chat-client'
import { ChatClientOptions } from 'twitch-chat-client/lib/ChatClient'
import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage'
import { UserNotice } from 'twitch-chat-client/lib/Capabilities/TwitchCommandsCapability/MessageTypes/UserNotice'
import say from 'say'

import { twitch } from '../../config'
import { dance, shoutout } from '../../common'
import { onBitsEvent, onChatEvent, onRedeemEvent, onSubEvent, toSayEvent, onDonateEvent } from '../../models'
import { Log } from '../mongo'
import { Event, Events } from '../events'
import { Rewards } from '../pubsub'

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

  async init() {
    try {
      await this.chat.connect()
      console.log('Chat Bot: connected', this.channel)
      this.chat.action(this.channel, 'chat connected')
    } catch (err) {
      console.error(err)
    }

    this.chat.onMessage((channel: string, user: string, message: string, msg: TwitchPrivateMessage) => this.onChat(channel, user, message, msg))
    this.chat.onRaid((channel: string, user: string, raidInfo: ChatRaidInfo, msg: UserNotice) => this.onRaid(channel, user, raidInfo, msg))
    this.chat.onHosted((channel: string, user: string, auto: boolean, viewers?: number) => this.onHosted(channel, user, auto, viewers))
    this.chat.onTimeout((channel: string, user: string, duration: number) => this.onTimeout(channel, user, duration))

    Event.addListener(Events.onChannelRedeem, (onRedeem: onRedeemEvent) => this.onChannelRedeem(onRedeem))
    Event.addListener(Events.onSub, (onSub: onSubEvent) => this.onSub(onSub))
    Event.addListener(Events.onBits, (onBits: onBitsEvent) => this.onBits(onBits))
    Event.addListener(Events.onDonate, (onDonateEvent: onDonateEvent) => this.onDonate(onDonateEvent))
    Event.addListener(Events.toSay, (toSay: toSayEvent) => this.toSay(toSay))
  }

  private async onChat(channel: string, user: string, message: string, msg: TwitchPrivateMessage) {
    console.log(message)
    if (user === this.chat.currentNick) return
    if (user.toLowerCase() === 'nightbot') return
    if (user.toLowerCase() === 'u2san_') return
    if (user.toLowerCase() === 'fossabot') return

    const command = message.toLowerCase().trim()

    const log = new Log({
      channel: channel,
      user: user,
      msg: message,
      date: new Date()
    })
    log.save()

    if (!command.startsWith('!')) {
      this.emit(Events.onChat, new onChatEvent(msg.tags.get('id'), user, msg.parseEmotes(), message))
    }

    if (msg.tags.get('msg-id') === 'highlighted-message') {
      say.speak(message)
    }

    if (command.split(' ')[0] === '!so') {
      if (this.isMod(msg)) {
        const username = command.split(' ')[1].replace('@', '')
        shoutout(username)
      }
    }

    if (command === '!ss') {
      if (user === this.channel) {
        say.stop()
      }
    }

    if (command === '!vanish') {
      this.chat.timeout(channel, user, 1, `${user} used vanish`)
    }

    if (command === '!dance') {
      const donateMsg = 'for each sub (tier 2 and 3 have a multiplier of 2, 3 respectively) or 500 bits (more than 500 bits have a multiplier of 1 every 1000 bits) or $5 donation (more than) there would be a random chance for a dance'
      this.chat.say(channel, donateMsg)
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
    this.chat.say(channel, `!so ${user}`)
  }

  private isMod(msg: TwitchPrivateMessage) {
    return msg.userInfo.isMod || msg.userInfo.isBroadcaster
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
        this.chat.say(this.channel, `!settitle ${event.reward.message}`)
        break
      case Rewards.timeout:
        this.chat.timeout(this.channel, event.reward.message, 180, `${event.reward.userDisplayName} redeemed ${event.reward.rewardName}`)
        break
      case Rewards.cancelStop:
        this.chat.say(this.channel, `thanks to ${event.reward.userName} for cancelling the stop stream reward`)
        break
      default:
        this.chat.say(this.channel, `${event.reward.userName} redeemed a reward`)
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
}