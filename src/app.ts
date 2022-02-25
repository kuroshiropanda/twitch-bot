import { reverseProxy } from '@config'
import { DiscordHandler } from '@discord'
import { ErrorHandler } from '@errorHandler'
import { EventHandler } from '@events'
import { app } from '@express'
import http from 'http'
import { startObs, startStreamlabs, startBot } from './startup'

export const startApp = async () => {
  new ErrorHandler()
  const server = http.createServer(app)
  const discord = new DiscordHandler()
  const io = new EventHandler(server)

  await discord.init()
  await io.init()

  startObs()
  startBot()
  startStreamlabs()

  server.listen(reverseProxy.port)
}
