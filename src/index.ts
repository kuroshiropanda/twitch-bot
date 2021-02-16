import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
const env = dotenv.config()
dotenvExpand(env)

import http from 'http'

import { reverseProxy } from '@config'
import { DiscordHandler } from '@discord'
import { EventHandler } from '@events'
import { ErrorHandler } from '@errorHandler'
import { app } from '@express'

import { startBot, startObs, startStreamlabs, startUser } from 'startup'

const start = async () => {

  new ErrorHandler()
  const server = http.createServer(app)
  const discord = new DiscordHandler()
  const io = new EventHandler(server)

  await discord.init()
  await io.init()

  startObs()
  startBot()
  startUser()
  startStreamlabs()

  server.listen(reverseProxy.port)
}

start()