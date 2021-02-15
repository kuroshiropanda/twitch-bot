import express from 'express'

import { twitch, file, reverseProxy } from '@config'
import { Auth, Twitch } from '@twitch'
import { startBot, startUser } from 'startup'

const twitchRoutes = express.Router()

twitchRoutes.get('/bot', (req, res) => {
  const url = `https://id.twitch.tv/oauth2/authorize?client_id=${ twitch.clientId }&redirect_uri=${ twitch.redirectURI }&response_type=code&scope=${ twitch.botScopes.join(' ') }&force_verify=true`
  res.redirect(url)
})

twitchRoutes.get('/user', (req, res) => {
  const url = `https://id.twitch.tv/oauth2/authorize?client_id=${ twitch.clientId }&redirect_uri=${ twitch.redirectURI }&response_type=code&scope=${ twitch.scopes.join(' ') }&force_verify=true`
  res.redirect(url)
})

twitchRoutes.get('/callback', async (req, res) => {
  const data = await Twitch.getToken(req.query.code)
  if (data.auth.scope.length <= 10) {
    const bot = new Auth(file.bot)
    bot.id = data.user.id
    bot.username = data.user.login
    bot.token = data.auth.access_token
    bot.refreshToken = data.auth.refresh_token
    bot.expiry = data.auth.expires_in
    await bot.save()
    res.send(data)

    startBot()
  } else {
    const user = new Auth(file.user)
    user.id = data.user.id
    user.username = data.user.login
    user.token = data.auth.access_token
    user.refreshToken = data.auth.refresh_token
    user.expiry = data.auth.expires_in
    await user.save()

    startUser()
    res.redirect(`${reverseProxy.path}/streamlabs/login`)
  }
})

export { twitchRoutes }