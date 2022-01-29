import { file, reverseProxy } from '@config'
import { OBSController } from '@obs'
import { Streamlabs } from '@streamlabs'
import { ApiHandler, Auth, Chat, EventSub, JSONData, PubSub } from '@twitch'
import { ApiClient } from '@twurple/api'

const obs = new OBSController()

export const startObs = async () => {
  await obs.connect()
}

export const startBot = async () => {
  const bot = new Auth(file.bot)
  try {
    const chat = new Chat(await bot.AuthProvider())
    await chat.init()
  } catch (e) {
    const url = `${reverseProxy.url}${reverseProxy.path}/twitch/bot`
    console.info(`open this on your browser: ${url}`)
  }
}

export const startUser = async () => {
  const user = new Auth(file.user)
  let userInfo: JSONData
  try {
    userInfo = await user.readFile()
    const authProvider = await user.AuthProvider()
    const api = new ApiClient({ authProvider })
    const apiHandler = new ApiHandler(api)
    await apiHandler.init()
    const pubsub = new PubSub(authProvider, userInfo.id)
    await pubsub.init()
    const eventsub = new EventSub(userInfo.id)
    await eventsub.init()
  } catch (e) {
    const url = `${reverseProxy.url}${reverseProxy.path}/twitch/user`
    console.info(`open this on your browser: ${url}`)
  }
}

export const startStreamlabs = async () => {
  const slJSON = await Streamlabs.readJSON()
  if (slJSON.token.length > 0) {
    const sl = new Streamlabs(slJSON.socket, slJSON.token)
    await sl.init()
  } else {
    await Streamlabs.createFile()
  }
}
