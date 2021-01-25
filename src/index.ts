import dotenv from 'dotenv'
dotenv.config()

import { promises as fs } from 'fs'
import http from 'http'
import express from 'express'
import { ApiClient } from 'twitch'

import { twitch } from './config/twitch'
import { streamlabs } from './config/streamlabs'

import Twitch from './services/twitch'
import Chat from './services/chat'
import PubSub from './services/pubsub'
import ApiHandler from './services/api'
import EventSub from './services/eventsub'
import DiscordHandler from './services/discord'
import OBSController from './services/obs'
import Streamlabs from './services/streamlabs'
import { EventHandler } from './services/events'

import { BRB } from './common'
import User from './user'
import Bot from './bot'
import Steam from './services/steam'

(async () => {

  const app = express()
  const server = http.createServer(app)
  const discord = new DiscordHandler()
  const io = new EventHandler(server)

  await discord.init()
  await io.init()

  const obsFunction = async () => {
    const obs = new OBSController()
    await obs.connect()
  }

  const botFunction = async () => {
    const botJSON = await Twitch.readJSON('bot.json')
    if (botJSON.token.length !== 0) {
      const bot = new Bot(botJSON)
      const chat = new Chat(bot.AuthProvider())
      await chat.init()
    } else {
      const url = `http://localhost:3000/bot/login`
      console.info(`open this on your browser: ${ url }`)
    }
  }

  const userFunction = async () => {
    const userJSON = await Twitch.readJSON('user.json')
    if (userJSON.token.length !== 0) {
      const user = new User(userJSON)
      const api = new ApiClient({ authProvider: user.AuthProvider() })
      const apiHandler = new ApiHandler(api)
      const pubsub = new PubSub(api)
      const eventsub = new EventSub(userJSON.id)
      await apiHandler.init()
      await pubsub.init()
      await eventsub.init()
    } else {
      const url = `http://localhost:3000/login`
      console.info(`open this on your browser: ${ url }`)
    }
  }

  const streamlabsFunction = async () => {
    const slJSON = await Streamlabs.readJSON('streamlabs.json')
    if (slJSON.token.length !== 0) {
      const sl = new Streamlabs(slJSON.socket, slJSON.token)
      await sl.init()
    }
  }

  obsFunction()
  botFunction()
  userFunction()
  streamlabsFunction()

  const port = 3000

  app.use('/', express.static('resources/views/index'))
  app.use('/clips', express.static('resources/views/clips'))
  app.use('/so', express.static('resources/views/shoutout'))
  app.use('/niconico', express.static('resources/views/niconico'))

  app.get('/obs/connect', async (req, res) => {
    obsFunction()
    res.send('obs: connected')
  })

  app.get('/bot/login', (req, res) => {
    const url = `https://id.twitch.tv/oauth2/authorize?client_id=${ twitch.clientId }&redirect_uri=${ twitch.redirectURI }&response_type=code&scope=${ twitch.botScopes.join(' ') }&force_verify=true`
    res.redirect(url)
  })

  app.get('/login', (req, res) => {
    const url = `https://id.twitch.tv/oauth2/authorize?client_id=${ twitch.clientId }&redirect_uri=${ twitch.redirectURI }&response_type=code&scope=${ twitch.scopes.join(' ') }&force_verify=true`
    res.redirect(url)
  })

  app.get('/streamlabs', (req, res) => {
    const url = `https://streamlabs.com/api/v1.0/authorize?response_type=code&client_id=${ streamlabs.clientId }&redirect_uri=${ streamlabs.redirectURI }&scope=${ streamlabs.scopes.join('+') }`
    res.redirect(url)
  })

  app.get('/callback', async (req, res) => {
    const data = await Twitch.getToken(req.query.code)
    if (data.auth.scope.length <= 8) {
      const bot = new Bot()
      bot.id = data.user.id
      bot.username = data.user.login
      bot.token = data.auth.access_token
      bot.refreshToken = data.auth.refresh_token
      bot.expiry = data.auth.expires_in
      const save = await bot.save()
      res.send(data)

      if (save) botFunction()
    } else {
      const user = new User()
      user.id = data.user.id
      user.username = data.user.login
      user.token = data.auth.access_token
      user.refreshToken = data.auth.refresh_token
      user.expiry = data.auth.expires_in
      const save = await user.save()

      if (save) userFunction()
      res.redirect('/streamlabs')
    }
  })

  app.get('/streamlabs/callback', async (req, res) => {
    const data = await Streamlabs.getToken(req.query.code)
    const file = {
      token: data[0].access_token,
      refreshToken: data[0].refresh_token,
      expiry: data[0].expires_in,
      socket: data[1].socket_token
    }
    await fs.writeFile('streamlabs.json', JSON.stringify(file, null, 2), 'utf-8')

    streamlabsFunction()
    res.json(data)
  })

  app.get('/clip/:user/:cursor', async (req, res) => {
    const clips = await BRB(req.params.user, req.params.cursor)
    res.json(clips)
  })

  app.get('/update/steam', async (req, res) => {
    const steam = await Steam.updateJSON()
    res.send(steam)
  })

  server.listen(port, () => {
    console.log(`app listening at http://localhost:${ port }`)
  })
})()
