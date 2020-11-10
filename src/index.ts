import dotenv from 'dotenv'
dotenv.config()

import http from 'http'
import express from 'express'
import { ApiClient } from 'twitch'
import { AuthProvider, RefreshableAuthProvider, StaticAuthProvider } from 'twitch-auth'

import { twitch } from './config/twitch'
import { streamlabs } from './config/streamlabs'
import { Bot, User } from './services/mongo'
import Twitch from './services/twitch/twitch'
import Chat from './services/chat'
import PubSub from './services/pubsub'
import ApiHandler from './services/api'
import DiscordHandler from './services/discord'
import obsController from './services/obs'
import Streamlabs from './services/streamlabs'
import { EventHandler } from './services/events'
import { BRB } from './common'

(async () => {
  const botClientOnRefresh = async ({ accessToken, refreshToken, expiryDate }) => {
    let newTokenData: object = {
      username: bot.username,
      accessToken: accessToken,
      refreshToken: refreshToken,
      expiry: expiryDate === null ? null : expiryDate.getTime()
    }

    Bot.update(newTokenData)
  }
  const bot: any = await Bot.read({ username: 'kuroshiropanda_' })
  const botAuth: AuthProvider = new RefreshableAuthProvider(
    new StaticAuthProvider(twitch.clientId, bot.token), {
    clientSecret: twitch.clientSecret,
    refreshToken: bot.refreshToken,
    expiry: bot.expiry === null ? null : new Date(bot.expiry),
    onRefresh: botClientOnRefresh
  })

  const userClientOnRefresh = async ({ accessToken, refreshToken, expiryDate }) => {
    let newTokenData: object = {
      username: user.username,
      accessToken: accessToken,
      refreshToken: refreshToken,
      expiry: expiryDate === null ? null : expiryDate.getTime()
    }

    User.update(newTokenData)
  }
  const user: any = await User.read({ username: 'kuroshiropanda' })
  const userAuth: AuthProvider = new RefreshableAuthProvider(
    new StaticAuthProvider(twitch.clientId, user.token), {
    clientSecret: twitch.clientSecret,
    refreshToken: user.refreshToken,
    expiry: user.expiry === null ? null : new Date(user.expiry),
    onRefresh: userClientOnRefresh
  })

  const app = express()
  const server = http.createServer(app)
  const api = new ApiClient({ authProvider: userAuth, initialScopes: twitch.scopes })
  const chat = new Chat(botAuth)
  const pubsub = new PubSub(api)
  const apiHandler = new ApiHandler(api)
  const discord = new DiscordHandler()
  const obs = new obsController()
  const io = new EventHandler(server)

  try {
    await chat.init()
    await pubsub.init()
    await obs.connect()
    await discord.init()
    await io.init()
    await apiHandler.init()
  } catch (err) {
    console.error(err)
  }

  if (user.streamlabs) {
    const streamlabs = new Streamlabs(user.streamlabs.token, user.streamlabs.socketToken)

    try {
      await streamlabs.init()
    } catch (err) {
      console.error(err)
    }
  }

  const port: number = 3000

  app.use('/', express.static('resources/views/index'))
  app.use('/clips', express.static('resources/views/clips'))
  app.use('/so', express.static('resources/views/shoutout'))
  app.use('/niconico', express.static('resources/views/niconico'))
  app.get('/obs/connect', async (req, res) => {
    try {
      await obs.connect()
      res.send('obs: connected')
    } catch (err) {
      res.send(err)
    }
  })
  app.get('/bot/login', (req, res) => {
    res.redirect(`https://id.twitch.tv/oauth2/authorize?client_id=${twitch.clientId}&redirect_uri=${twitch.redirectURI}&response_type=code&scope=${twitch.botScopes.join(' ')}&force_verify=true`)
  })
  app.get('/login', (req, res) => {
    res.redirect(`https://id.twitch.tv/oauth2/authorize?client_id=${twitch.clientId}&redirect_uri=${twitch.redirectURI}&response_type=code&scope=${twitch.scopes.join(' ')}&force_verify=true`)
  })
  app.get('/streamlabs', (req, res) => {
    res.redirect(`https://streamlabs.com/api/v1.0/authorize?response_type=code&client_id=${streamlabs.clientId}&redirect_uri=${streamlabs.redirectURI}&scope=${streamlabs.scopes.join('+')}`)
  })
  app.get('/callback', async (req, res) => {
    const data = await Twitch.getToken(req.query.code)
    if (data[0].scope.length === 9) {
      Bot.create(data)
      res.send(data)
    } else {
      User.create(data)
      res.redirect('/streamlabs')
    }
  })
  app.get('/streamlabs/callback', async (req, res) => {
    const data = await Streamlabs.getToken(req.query.code)
    User.addStreamlabs({
      twitchId: user.twitchId,
      token: data[0].access_token,
      refresh_token: data[0].refresh_token,
      socket_token: data[1].socket_token
    })
    res.json(data)
  })
  app.get('/channels', async (req, res) => {
    res.send(await Twitch.getUsers())
  })

  app.get('/clip/:user/:cursor', async (req, res) => {
    const clips = await BRB(req.params.user, req.params.cursor)
    res.json(clips)
  })

  server.listen(port, () => {
    console.log(`app listening at http://localhost:${port}`)
  })
})()