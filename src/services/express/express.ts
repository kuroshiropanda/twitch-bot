import express from 'express'

import { reverseProxy } from '@config'
import { twitchRoutes, streamlabsRoute, steamRoute } from '@routes'
import { startObs } from 'startup'

const app = express()
app.use(`${reverseProxy.path}/so`, express.static('resources/views/shoutout'))
app.use(`${reverseProxy.path}/twitch`, twitchRoutes)
app.use(`${reverseProxy.path}/streamlabs`, streamlabsRoute)
app.use(`${reverseProxy.path}/steam`, steamRoute)

app.get(`${reverseProxy.path}/obs/connect`, async (req, res) => {
  startObs()
  res.send('obs: connected')
})

export { app }