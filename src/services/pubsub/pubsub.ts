import { ApiClient } from 'twitch'
import { RefreshableAuthProvider, StaticAuthProvider } from 'twitch-auth'
// import { ChatClient } from 'twitch-chat-client'
import { PubSubBitsMessage, PubSubClient, PubSubRedemptionMessage, PubSubSubscriptionMessage } from 'twitch-pubsub-client'
import say from 'say'
import { dance } from '../../common'
import { User } from '../mongo/mongo'
import { twitch } from '../../config'
import obsController from '../obs'

import api from '../api'
import { Event, Events } from '../events'
import { onRedeemEvent, onSubEvent, onBitsEvent } from '../../models'

// const PubSub = async () => {
//     const channel = 'kuroshiropanda'

//     const ClientOnRefresh = async ({ accessToken, refreshToken, expiryDate }) => {
//         const newTokenData = {
//             username: channel,
//             accessToken: accessToken,
//             refreshToken: refreshToken,
//             expiry: expiryDate === null ? null : expiryDate.getTime()
//         }

//         User.update(newTokenData)
//     }

//     const user: any = await User.read({ username: channel })

//     const auth = new RefreshableAuthProvider(
//         new StaticAuthProvider(twitch.clientId, user.accessToken), {
//             clientSecret: twitch.clientSecret,
//             refreshToken: user.refreshToken,
//             expiry: user.expiry === null ? null : new Date(user.expiry),
//             onRefresh: ClientOnRefresh
//         })

//     const api = new ApiClient({ authProvider: auth, initialScopes: twitch.scopes })
// }

export default class PubSub {

    private api: ApiClient
    private pubsub: PubSubClient
    private channel: string
    
    constructor(api: ApiClient) {
        this.api = api
        this.pubsub = new PubSubClient()
        this.channel = twitch.channel
    }

    async init() {
        try {
            await this.pubsub.registerUserListener(this.api, this.channel)
            console.log('PubSub: connected')
        } catch (err) {
            console.error(err)
        }

        this.pubsub.onRedemption(this.channel, (msg: PubSubRedemptionMessage) => {
            console.log(`${msg.userName} redeemed ${msg.rewardId} : ${msg.rewardName}`)
            this.emit(Events.onChannelRedeem, new onRedeemEvent(msg))
        })

        this.pubsub.onSubscription(this.channel, (msg: PubSubSubscriptionMessage) => {
            this.emit(Events.onSub, new onSubEvent(msg))
        })

        this.pubsub.onBits(this.channel, (msg: PubSubBitsMessage) => {
            this.emit(Events.onBits, new onBitsEvent(msg))
        })

        // this.pubsub.onRedemption(this.channel, async (msg) => {
            // console.log(`${msg.userName} redeemed ${msg.rewardId} : ${msg.rewardName}`)

            // this.emit(Events.onChannelRedeem, new onRedeemEvent(msg))

            // // ad time
            // if (msg.rewardId === '48ec132b-10d4-4d89-80f2-79e89108ea53') {
            //     try {
            //         await api.kraken.channels.startChannelCommercial(msg.channelId, 30)
            //     } catch (err) {
            //         console.log(err)
            //     }
            //     // chat.runCommercial(channel, 30).catch((e) => {
            //     //     console.log(e)
            //     // })
            // }

            // // change stream title
            // if (msg.rewardId === '5318e76f-a631-48f6-9282-5670329c6b87') {
            //     try {
            //         await api.kraken.channels.updateChannel(msg.channelId, {
            //             status: msg.message
            //         })
            //     } catch (err) {
            //         console.log(err)
            //     }
            // }

            // // silence me
            // if (msg.rewardId === 'f9d5f500-6eaa-4c9f-b000-4682e576223a') {
            //     // obsController.silence()
            //     // obs.silence()
            // }

            // // to be continued
            // if (msg.rewardId === '0b21ea53-344a-4ac1-9dd1-b11b3ff50726') {
            //     // obsController.tbc()
            //     // chat.say(channel, 'test')
            //     // obs.tbc()
            // }

            // // brain power reward
            // // if (msg.rewardId === '051716ec-4ef1-47fd-9a2d-05cdcbf3cf42') {
            // //     bpower()
            // // }

            // // gulat reward
            // // if (msg.rewardId === '1ad19825-a26e-4f2f-9a8c-7628de6792ad') {
            // //     gulat()
            // // }

            // // shout out
            // if (msg.rewardId === 'ec633702-a265-4ae5-bb67-acd4c5204c3b') {
            //     say.speak(`Shout out to ${msg.userName}`)
            //     // chat.say(channel, `!so ${msg.userName}`)
            // }

            // // time out
            // if (msg.rewardId === 'c13eb27a-4581-438d-8076-b1c7db68bc57') {
            //     // chat.timeout(channel, msg.message, 180, `${msg.userDisplayName} redeemed ${msg.rewardName}`)
            // }

            // // stop stream
            // if (msg.rewardId === '853b6498-800e-486a-a475-4db03e45bc5c') {
            //     // obsController.stop()
            // }

            // // cancel stop stream
            // if (msg.rewardId === '1da0e924-a4fa-4056-8261-68dbf477fa07') {
            //     // obsController.cancelStop()
            //     // chat.say(channel, `thanks for cancelling the stop stream reward ${msg.userName}`)
            // }
        // })

        // this.pubsub.onSubscription(this.channel, (msg) => {
        //     // chat.say(channel, `${channel} will ${dance() ? 'dance' : 'not dance'}`)
        // })

        // this.pubsub.onBits(this.channel, (msg) => {
        //     if (msg.bits >= 500) {
        //         // chat.say(channel, `${channel} will ${dance() ? 'dance' : 'not dance'}`)
        //     }
        // })
    }

    private emit(event: Events, payload: any) {
        Event.emit(event, payload)
    }

    // private onRedeem(msg: PubSubRedemptionMessage) {
    //     console.log(`${msg.userName} redeemed ${msg.rewardId} : ${msg.rewardName}`)
    //     this.emit(Events.onChannelRedeem, new onRedeemEvent(msg))
    // }

    // private onSub(msg: PubSubSubscriptionMessage) {
    //     this.emit(Events.onSubscription, new onSubEvent(msg))
    // }

    // private onBits(msg: PubSubBitsMessage) {
    //     this.emit(Events.onBits, new onBitsEvent(msg))
    // }
}