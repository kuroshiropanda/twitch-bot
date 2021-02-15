import express from 'express'
import { promises as fs } from 'fs'

import { streamlabs, file } from '@config'
import { Streamlabs } from '@streamlabs'
import { startStreamlabs } from 'startup'

const streamlabsRoute = express.Router()

streamlabsRoute.get(`/login`, (req, res) => {
  const url = `https://streamlabs.com/api/v1.0/authorize?response_type=code&client_id=${ streamlabs.clientId }&redirect_uri=${ streamlabs.redirectURI }&scope=${ streamlabs.scopes.join('+') }`
  res.redirect(url)
})

streamlabsRoute.get(`/callback`, async (req, res) => {
  const streamlabs = await Streamlabs.getToken(req.query.code)
  const data = {
    token: streamlabs.token.access_token,
    refreshToken: streamlabs.token.refresh_token,
    expiry: streamlabs.token.expires_in,
    socket: streamlabs.socket.socket_token
  }
  await fs.writeFile(file.streamlabs, JSON.stringify(data, null, 2), 'utf-8')

  startStreamlabs()
  res.send(streamlabs)
})

export { streamlabsRoute }