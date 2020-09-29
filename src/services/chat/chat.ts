import { AuthProvider } from 'twitch-auth'
import { ChatClient, ChatRaidInfo } from 'twitch-chat-client'
import { ChatClientOptions } from 'twitch-chat-client/lib/ChatClient'
import { TwitchPrivateMessage } from 'twitch-chat-client/lib/StandardCommands/TwitchPrivateMessage'
import { UserNotice } from 'twitch-chat-client/lib/Capabilities/TwitchCommandsCapability/MessageTypes/UserNotice'
import say from 'say'

import { twitch } from '../../config'
import { Bot, Log } from '../mongo/mongo'
import { dance, shoutout } from '../../common'
import { Event, Events } from '../events'

import { onBitsEvent, onChatEvent, onRedeemEvent, onSubEvent, toSayEvent } from '../../models'
import { Rewards } from '../pubsub/rewards'


export default class Chat {

    private chat: ChatClient
    private opts: ChatClientOptions
    private channel: string

    constructor(auth: AuthProvider) {
        this.channel = twitch.channel
        this.opts = {
            webSocket: true,
            channels: [ this.channel ],
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

        this.chat.onMessage((channel: string, user: string, message: string, msg: TwitchPrivateMessage) => {
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
    
            if(!command.startsWith('!')) {
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
    
            // if (command.split(' ')[0] === '!game') {
            //     if (this.isMod(msg)) {
            //         const game = command.split(' ')[1]
            //         const gameName = await api.helix.games.getGameByName(game)
    
            //         if (gameName) {
            //             console.log(gameName.name)
            //         }
            //     }
            // }
    
            if (command === '!ss') {
                if (user === 'kuroshiropanda') {
                    say.stop()
                }
            }
    
            if (command === '!vanish') {
                this.chat.timeout(channel, user, 1, `${user} used vanish`)
            }
    
            if (command === '!dance') {
                this.chat.say(channel, 'for each sub (tier 2 and 3 have a multiplier of 2, 3 respectively)/500 bits (more than 500 bits have a multiplier of 1 every 500 bits) there would be a random chance for a dance')
            }
        })

        this.chat.onRaid((channel: string, user: string, raidInfo: ChatRaidInfo, msg: UserNotice) => {
            this.shoutOut(channel, user)
            // shoutout(user)
            // this.chat.say(channel, `Shoutout to ${user} for raiding us with ${raidInfo.viewerCount} people`)
        })

        this.chat.onHosted((channel: string, user: string, auto: boolean, viewers?: number) => {
            if (!auto) {
                this.shoutOut(channel, user)
                // shoutout(user)
                // this.chat.say(channel, `Shoutout to ${user} for hosting us with ${viewers} people`)
            }
        })

        Event.addListener(Events.onChannelRedeem, (onRedeem: onRedeemEvent) => this.onChannelRedeem(onRedeem))
        Event.addListener(Events.onSub, (onSub: onSubEvent) => this.onSub(onSub))
        Event.addListener(Events.onBits, (onBits: onBitsEvent) => this.onBits(onBits))
        Event.addListener(Events.toSay, (toSay: toSayEvent) => this.toSay(toSay))

        this.chat.onTimeout((channel, user, duration) => {
            this.chat.say(channel, `${user} was timed out for ${duration}`)
        })
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

    // private onChat(channel: string, user: string, message: string, msg: TwitchPrivateMessage) {
    //     console.log(message)
    //     if (user === this.chat.currentNick) return
    //     if (user.toLowerCase() === 'nightbot') return
    //     if (user.toLowerCase() === 'u2san_') return
    //     if (user.toLowerCase() === 'fossabot') return

    //     // socket.emit('NicoNicoChat', { id: msg.tags.get('id'), user, emotes: msg.parseEmotes(), message })

    //     const command = message.toLowerCase().trim()

    //     // const log = new Log({
    //     //     channel: channel,
    //     //     user: user,
    //     //     msg: message,
    //     //     date: new Date()
    //     // })
    //     // log.save()

    //     // if(!command.startsWith('!')) {
    //     //     this.emit(Events.onChat, new onChatEvent(msg.tags.get('id'), msg.parseEmotes()))
    //     // }

    //     if (msg.tags.get('msg-id') === 'highlighted-message') {
    //         say.speak(message)
    //     }

    //     if (command.split(' ')[0] === '!so') {
    //         if (this.isMod(msg)) {
    //             const username = command.split(' ')[1].replace('@', '')
    //             shoutout(username)
    //         }
    //     }

    //     // if (command.split(' ')[0] === '!game') {
    //     //     if (this.isMod(msg)) {
    //     //         const game = command.split(' ')[1]
    //     //         const gameName = await api.helix.games.getGameByName(game)

    //     //         if (gameName) {
    //     //             console.log(gameName.name)
    //     //         }
    //     //     }
    //     // }

    //     if (command === '!ss') {
    //         if (user === 'kuroshiropanda') {
    //             say.stop()
    //         }
    //     }

    //     if (command === '!vanish') {
    //         this.chat.timeout(channel, user, 1, `${user} used vanish`)
    //     }

    //     if (command === '!dance') {
    //         this.chat.say(channel, 'for each sub/500 bits/$5 donation there would be a random chance for a dance')
    //     }
    // }

    // private onRaid(channel: string, user: string, raidInfo: ChatRaidInfo, msg: UserNotice) {
    //     shoutout(user)
    //     this.chat.say(channel, `Shoutout to ${user} for raiding us with ${raidInfo.viewerCount} people`)
    // }

    // private onHosted(channel: string, user: string, auto: boolean, viewers?: number) {
    //     if (!auto) {
    //         shoutout(user)
    //         this.chat.say(channel, `Shoutout to ${user} for hosting us with ${viewers} people`)
    //     }
    // }

    private toSay(event: toSayEvent) {
        this.chat.say(this.channel, event.msg)
    }

    private onChannelRedeem(event: onRedeemEvent) {
        if (event.reward.rewardId === Rewards.ad) this.chat.runCommercial(this.channel, 30)
        if (event.reward.rewardId === Rewards.shoutOut) say.speak(`Shoutout to ${event.reward.userName}`)
        if (event.reward.rewardId === Rewards.changeTitle) this.chat.say(this.channel, `!settitle ${event.reward.message}`)
        if (event.reward.rewardId === Rewards.timeout) this.chat.timeout(this.channel, event.reward.message, 180, `${event.reward.userDisplayName} redeemed ${event.reward.rewardName}`)
        if (event.reward.rewardId === Rewards.cancelStop) this.chat.say(this.channel, `thanks to ${event.reward.userName} for cancelling the stop stream reward`)
    }

    private onSub(event: onSubEvent) {
        let multiplier = Number(event.sub.subPlan === 'Prime' ? 1500 : event.sub.subPlan) / 1000
        this.chat.say(this.channel, `${this.channel} will ${dance(multiplier) ? 'dance' : 'not dance'}`)
    }

    private onBits(event: onBitsEvent) {
        if (event.bit.bits >= 500) this.chat.say(this.channel, `${this.channel} will ${dance(event.bit.bits <= 500 ? 1 : Math.floor(event.bit.bits / 1000)) ? 'dance' : 'not dance'}`)
    }
}