import { file, reverseProxy, twitch } from '@config'
import { Twitch } from '@twitch'
import express from 'express'
import { twitchAuth } from '../common'
import { startBot } from '../startup'

export const twitchRouter = express.Router()

twitchRouter.get('/bot', (req, res) => {
  console.log('test')
  const url = `https://id.twitch.tv/oauth2/authorize?client_id=${
    twitch.clientId
  }&redirect_uri=${
    twitch.redirectURI.bot
  }&response_type=code&scope=${twitch.botScopes.join(' ')}&force_verify=true`
  res.redirect(url)
})

twitchRouter.get('/user', (req, res) => {
  const url = `https://id.twitch.tv/oauth2/authorize?client_id=${
    twitch.clientId
  }&redirect_uri=${
    twitch.redirectURI.user
  }&response_type=code&scope=${twitch.scopes.join(' ')}&force_verify=true`
  res.redirect(url)
})

twitchRouter.get('/bot/callback', async (req, res) => {
  const data = await Twitch.getToken(req.query.code as string, twitch.redirectURI.bot)
  await twitchAuth(file.bot, data.auth, data.user)
  res.send(data)
})

twitchRouter.get('/user/callback', async (req, res) => {
  const data = await Twitch.getToken(req.query.code as string, twitch.redirectURI.user)
  await twitchAuth(file.user, data.auth, data.user)
  await startBot()
  res.redirect(`${reverseProxy.path}/streamlabs/login`)
})
