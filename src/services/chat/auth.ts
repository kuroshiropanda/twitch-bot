import TwitchClient from 'twitch'
import { twitch, scopes } from '../../config/twitch'
import { Bot } from '../mongo/mongo'

const ClientOnRefresh = async ({ accessToken, refreshToken, expiryDate }) => {
    const newTokenData = {
        username: 'u2san_',
        accessToken: accessToken,
        refreshToken: refreshToken,
        expiry: expiryDate === null ? null : expiryDate.getTime()
    }

    // fs.writeFile('./token.json', JSON.stringify(newTokenData, null, 4), { encoding: 'UTF8' })

    Bot.update(newTokenData)
}

const bot: any = Bot.read({ username: 'u2san_' })

export const auth = TwitchClient.withCredentials(twitch.clientId, bot.accessToken, scopes, {
    clientSecret: twitch.clientSecret,
    refreshToken: bot.refreshToken,
    expiry: bot.expiryTimestamp === null ? null : new Date(bot.expiryTimestamp),
    onRefresh: ClientOnRefresh
})