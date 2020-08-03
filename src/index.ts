import dotenv from 'dotenv'
dotenv.config()

import express from 'express'

import { twitch, scopes, channelList } from './config/twitch'
import { Bot, User } from './services/mongo/mongo'
import Twitch from './services/twitch/twitch'

const port: number = 3000
const app = express()

app.get('/login', (req, res) => {
    res.redirect(`https://id.twitch.tv/oauth2/authorize?client_id=${twitch.clientId}&redirect_uri=${twitch.redirectURI}&response_type=code&scope=${scopes.join(' ')}&force_verify=true`)
})

app.get('/callback', async (req, res) => {
    const data = await Twitch.getToken(req.query.code)
    User.create({
        twitchId: data.user.id,
        username: data.user.login,
        name: data.user.display_name,
        token: data.token.access_token,
        refreshToken: data.token.refresh_token,
        expiry: data.token.expires_in
    })
    res.send(data)
})

app.get('/channels', (req, res) => {
    res.send(channelList)
})

app.listen(port, () => {
    console.log(`app listening at http://localhost:${port}`)
})