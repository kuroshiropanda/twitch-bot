import { ApiClient } from 'twitch'

import { file, reverseProxy } from '@config'
import { Auth, ApiHandler, Chat, EventSub, PubSub } from '@twitch'
import { Streamlabs } from '@streamlabs'
import { OBSController } from '@obs'

const obs = new OBSController()

const startObs = async () => {
  await obs.connect()
}

const startBot = async () => {
  const bot = new Auth(file.bot)
  const botInfo = await bot.readFile()
  if (botInfo.token.length > 0) {
    const chat = new Chat(await bot.AuthProvider())
    await chat.init()
  } else {
    bot.writeFile(botInfo)
    const url = `${reverseProxy.url}${reverseProxy.path}/twitch/bot`
    console.info(`open this on your browser: ${ url }`)
  }
}

const startUser = async () => {
  const user = new Auth(file.user)
  const userInfo = await user.readFile()
  if (userInfo.token.length > 0) {
    const api = new ApiClient({ authProvider: await user.AuthProvider() })
    const apiHandler = new ApiHandler(api)
    const pubsub = new PubSub(api)
    const eventsub = new EventSub(userInfo.id)
    await apiHandler.init()
    await pubsub.init()
    await eventsub.init()
  } else {
    user.writeFile(userInfo)
    const url = `${reverseProxy.url}${reverseProxy.path}/twitch/user`
    console.info(`open this on your browser: ${ url }`)
  }
}

const startStreamlabs = async () => {
  const slJSON = await Streamlabs.readJSON()
  if (slJSON.token.length > 0) {
    const sl = new Streamlabs(slJSON.socket, slJSON.token)
    await sl.init()
  } else {
    await Streamlabs.createFile()
  }
}

export {
  startObs,
  startBot,
  startUser,
  startStreamlabs
}