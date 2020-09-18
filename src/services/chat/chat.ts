import { ApiClient } from 'twitch'
import { RefreshableAuthProvider, StaticAuthProvider } from 'twitch-auth'
import { ChatClient } from 'twitch-chat-client'
import say from 'say'
import Server from 'socket.io'
import { twitch } from '../../config/twitch'
import { Bot, Log } from '../mongo/mongo'
// import { obsControl } from '../obs/obs'
import Twitch from '../twitch/twitch'

const Chat = async () => {
    const ClientOnRefresh = async ({ accessToken, refreshToken, expiryDate }) => {
        const newTokenData = {
            twitchId: '74955654',
            accessToken: accessToken,
            refreshToken: refreshToken,
            expiry: expiryDate === null ? null : expiryDate.getTime()
        }

        Bot.update(newTokenData)
    }

    const bot: any = await Bot.read({ twitchId: '74955654' })

    const auth = new RefreshableAuthProvider(
        new StaticAuthProvider(twitch.clientId, bot.accessToken), {
            clientSecret: twitch.clientSecret,
            refreshToken: bot.refreshToken,
            expiry: bot.expiry === null ? null : new Date(bot.expiry),
            onRefresh: ClientOnRefresh
        })

    interface chatOptsObj {
        webSocket: boolean
        channels: string[]
    }

    const chatOptions: chatOptsObj = {
        webSocket: true,
        channels: await Twitch.getUsers()
    }

    const socket = new Server(8000)
    socket.on('connection', (socket) => {
        console.log('socketio: connected')
    })
    const chat = new ChatClient(auth, chatOptions)
    const api = new ApiClient({ authProvider: auth })

    try {
        await chat.connect()
        console.log('Chat Bot: connected', chatOptions.channels)

    } catch (err) {
        console.log(err)
    }

    chat.onRaid(async (channel, user, raidInfo, msg) => {
        if (channel === '#kuroshiropanda') {
            // obsControl.tbc()
        }
        
        const userId = await api.kraken.users.getUserByName(user)
        socket.emit('ClipShoutout', await Twitch.getRandomClip(userId.id))
        chat.say(channel, `Shoutout to ${user} for raiding us with ${raidInfo.viewerCount} people`)
    })

    chat.onHosted(async (channel, user, auto, viewers) => {
        console.log({ user, auto, viewers })
        if (!auto) {
            const userId = await api.kraken.users.getUserByName(user)
            socket.emit('ClipShoutout', await Twitch.getRandomClip(userId.id))
            chat.say(channel, `Shoutout to ${user} for hosting us with ${viewers} people`)
        }
    })

    chat.onMessage(async (channel, user, message, msg) => {
        //  || user === channel.substr(1, channel.length)
        if (user === chat.currentNick) return
        
        const command = message.toLowerCase().trim()

        const bots = /buy follower/gi
        const mama = /\bmama\b/gi
        const hatdog = /\bha\?\b/gi

        const log = new Log({ 
            channel: channel,
            user: user,
            msg: message,
            date: new Date()
        })
        log.save()

        if (bots.test(command)) {
            chat.ban(channel, user, 'Spam bot')
            return
        }

        if (user === 'Nightbot' || 'u2san_' || 'kuroshiropanda_') {
            socket.emit('NicoNicoChat', { id: msg.tags.get('id'), emotes: msg.parseEmotes(), message })
        }

        if (msg.tags.get('msg-id') === 'highlighted-message') {
            say.speak(message)
        }

        if (command.split(' ')[0] === '!so') {
            const username = command.split(' ')[1].replace('@', '')
            const userId = await api.kraken.users.getUserByName(username)
            socket.emit('ClipShoutout', await Twitch.getRandomClip(userId.id))
        }

        if (command === '!ss') {
            if (user === 'kuroshiropanda') {
                say.stop()
            }
        }

        if (command === '!vanish') {
            chat.timeout(channel, user, 1, `${user} used vanish`)
        }
        
        if (command === '!dance') {
            chat.say(channel, 'for each sub/500 bits/$5 donation there would be a random chance for a dance')
        }

        if (mama.test(command)) {
            chat.say(channel, `@${user} mama mo`)
        }

        if (hatdog.test(command)) {
            chat.say(channel, `@${user} hatdog`)
        }
    })

    chat.onMessageRatelimit((channel, message) => {
        console.log('rate limit reached', { channel, message })
    })

    chat.onTimeout((channel, user, duration) => {
        chat.say(channel, `${user} was timed out for ${duration}`)
    })
}

export default Chat