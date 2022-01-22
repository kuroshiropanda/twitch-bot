import { reverseProxy } from '@config'
import { DiscordHandler } from '@discord'
import { ErrorHandler } from '@errorHandler'
import { EventHandler } from '@events'
import { app } from '@express'
import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
import http from 'http'
import { startBot, startObs, startStreamlabs, startUser } from './startup'
const env = dotenv.config()
dotenvExpand.expand(env)

;(async () => {
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
})()
