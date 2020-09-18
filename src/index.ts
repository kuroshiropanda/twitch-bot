import dotenv from 'dotenv'
dotenv.config()

import express from 'express'

import { twitch } from './config/twitch'
import { streamlabs } from './config/streamlabs'
import { Bot, User } from './services/mongo/mongo'
import Twitch from './services/twitch/twitch'
import Chat from './services/chat/chat'
import PubSub from './services/pubsub/pubsub'
import Streamlabs from './services/streamlabs/streamlabs'

Chat()
PubSub()

const port: number = 3000
const app = express()

const botScopes = [
    'channel:moderate',
    'chat:edit',
    'chat:read',
    'whispers:read',
    'whispers:edit',
    'channel:edit:commercial',
    // 'channel:read:hype_train',
    // 'channel:read:subscriptions',
    'clips:edit',
    // 'user:edit',
    'channel_commercial',
    'channel_editor',
]

app.use('/', express.static('resources/views/index'))
app.use('/clips', express.static('resources/views/clip'))
app.use('/so', express.static('resources/views/shoutout'))
app.use('/niconico', express.static('resources/views/niconico'))

app.get('/bot/login', (req, res) => {
    res.redirect(`https://id.twitch.tv/oauth2/authorize?client_id=${twitch.clientId}&redirect_uri=${twitch.redirectURI}&response_type=code&scope=${botScopes.join(' ')}&force_verify=true`)
})

app.get('/login', (req, res) => {
    res.redirect(`https://id.twitch.tv/oauth2/authorize?client_id=${twitch.clientId}&redirect_uri=${twitch.redirectURI}&response_type=code&scope=${twitch.scopes.join(' ')}&force_verify=true`)
})

app.get('/streamlabs', (req, res) => {
    res.redirect(`https://streamlabs.com/api/v1.0/authorize?response_type=code&client_id=${streamlabs.clientId}&redirect_uri=${streamlabs.redirectURI}&scope=${streamlabs.scopes.join('+')}`)
})

app.get('/callback', async (req, res) => {
    const data = await Twitch.getToken(req.query.code)
    console.log(data[0].scope.length)
    if (data[0].scope.length === 9) {
        Bot.create(data)
    } else {
        User.create(data)
    }
    res.send(data)
})

app.get('/streamlabs/callback', async (req, res) => {
    const data = await Streamlabs.getToken(req.query.code)
    res.json(data)
})

app.get('/channels', async (req, res) => {
    res.send(await Twitch.getUsers())
})


app.listen(port, () => {
    console.log(`app listening at http://localhost:${port}`)
})