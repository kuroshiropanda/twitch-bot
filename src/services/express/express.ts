import { reverseProxy } from '@config'
import { steamRoutes, streamlabsRoutes, twitchRoutes } from '@routes'
import express from 'express'
import { startObs } from '../../startup'

export const app = express()
app.use(`${reverseProxy.path}/so`, express.static('resources/views/shoutout'))
app.use(`${reverseProxy.path}/twitch`, twitchRoutes())
app.use(`${reverseProxy.path}/streamlabs`, streamlabsRoutes())
app.use(`${reverseProxy.path}/steam`, steamRoutes())

app.get(`${reverseProxy.path}/obs/connect`, async (req, res) => {
  startObs()
  res.send('obs: connected')
})
