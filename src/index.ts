import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
const env = dotenv.config()
dotenvExpand(env)

import http from 'http'
import express from 'express'

import { reverseProxy } from '@config'

import { DiscordHandler } from '@discord'
import { OBSController } from '@obs'
import { EventHandler } from '@events'
import { ErrorHandler } from '@errorHandler'

import { twitchRoutes, streamlabsRoute, steamRoute } from '@routes'
import { startBot, startStreamlabs, startUser } from 'startup'

const start = async () => {

  new ErrorHandler()
  const app = express()
  const server = http.createServer(app)
  const discord = new DiscordHandler()
  const io = new EventHandler(server)
  const obs = new OBSController()

  await discord.init()
  await io.init()

  const startObs = async () => {
    await obs.connect()
  }

  // startObs()
  startBot()
  startUser()
  startStreamlabs()

  app.use(`${reverseProxy.path}/so`, express.static('resources/views/shoutout'))
  app.use(`${reverseProxy.path}/twitch`, twitchRoutes)
  app.use(`${reverseProxy.path}/streamlabs`, streamlabsRoute)
  app.use(`${reverseProxy.path}/steam`, steamRoute)

  app.get(`${reverseProxy.path}/obs/connect`, async (req, res) => {
    startObs()
    res.send('obs: connected')
  })

  server.listen(reverseProxy.port)
}

start()