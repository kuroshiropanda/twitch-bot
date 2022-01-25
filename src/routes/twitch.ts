import { file, reverseProxy, twitch } from '@config'
import { Twitch } from '@twitch'
import express from 'express'
import { twitchAuth } from '../common'
import { startBot, startUser } from '../startup'

const twitchRouter = express.Router()

twitchRouter.get('/bot', (req, res) => {
  console.log('test')
  const url = `https://id.twitch.tv/oauth2/authorize?client_id=${
    twitch.clientId
  }&redirect_uri=${
    twitch.redirectURI
  }&response_type=code&scope=${twitch.botScopes.join(' ')}&force_verify=true`
  res.redirect(url)
})

twitchRouter.get('/user', (req, res) => {
  const url = `https://id.twitch.tv/oauth2/authorize?client_id=${
    twitch.clientId
  }&redirect_uri=${
    twitch.redirectURI
  }&response_type=code&scope=${twitch.scopes.join(' ')}&force_verify=true`
  res.redirect(url)
})

twitchRouter.get('/callback', async (req, res) => {
  const data = await Twitch.getToken(req.query.code)
  if (data.auth.scope.length <= 10) {
    await twitchAuth(file.bot, data.auth, data.user)
    startBot()
    res.send(data)
  } else {
    await twitchAuth(file.user, data.auth, data.user)
    startUser()
    res.redirect(`${reverseProxy.path}/streamlabs/login`)
  }
})

export const twitchRoutes = () => twitchRouter
// export { twitchRouter }
