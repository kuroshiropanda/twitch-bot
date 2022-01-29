import { reverseProxy } from '@config'
import { steamRouter, streamlabsRouter, twitchRouter } from '@routes'
import express from 'express'
import { startObs } from '../../startup'

export const app = express()
app.use(`${reverseProxy.path}/so`, express.static('resources/views/shoutout'))
app.use(`${reverseProxy.path}/twitch`, twitchRouter)
app.use(`${reverseProxy.path}/streamlabs`, streamlabsRouter)
app.use(`${reverseProxy.path}/steam`, steamRouter)

app.get(`${reverseProxy.path}/obs/connect`, async (req, res) => {
  startObs()
  res.send('obs: connected')
})
