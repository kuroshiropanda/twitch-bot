import ChatClient from 'twitch-chat-client'
import say from 'say'
import { User } from '../mongo/mongo'
import { auth } from './auth'
import { obsControl } from '../obs/obs'

const getChannels = async () => {
    return await User.readAll()
}

const chatOptions: object = {
    webSocket: true,
    requestMembershipEvents: true,
    channels: getChannels
}

const chat = ChatClient.forTwitchClient(auth, chatOptions)

chat.connect().then(() => {
    console.log('bot connected successfully')
}).catch((e) => {
    console.log(e)
})

chat.onRaid((channel, user, raidInfo, msg) => {
    if (channel === '#kuroshiropanda') {
        obsControl.tbc()
    }
})

chat.onPrivmsg((channel, user, message, msg) => {
    console.log(`${user} : ${message}`)

    if (msg.tags.get('msg-id') === 'highlighted-message') {
        say.speak(message)
    }

    const command = message.trim()

    if (command === '!ss') {
        if (user === 'kuroshiropanda') {
            say.stop()
        }
    } else if (command === '!dance') {
        chat.say(channel, 'for each sub or 500 bits cheer there would be a random chance for a dance')
    }
})