import { UserIdResolvable } from 'twitch/lib'

import { api } from './services/api'
import { Event, Events } from './services/events'

import {
  onShoutoutEvent,
  toSayEvent
} from './models'

interface clipObject {
  title: string,
  clip: string
}

const getClips = async (name: string, limit = 50, cursor?: string) => {
  try {
    const user = await api.kraken.users.getUserByName(name)
    const clips = await api.helix.clips.getClipsForBroadcaster(user.id, {
      limit: limit
    })

    return clips.data
  } catch (err) {
    console.error(err)
    return undefined
  }
}

const thumbnailToUrl = (url: string, res: string) => {
  const AT = /AT-cm%7C/g
  if (AT.test(url)) {
    return `${url.replace('-preview-480x272.jpg', `-${res}.mp4`)}`
  } else {
    return `${url.replace('twitch.tv/', 'twitch.tv/AT-cm%7C').replace('-preview-480x272.jpg', `-${res}.mp4`)}`
  }
}

const shoutout = async (user: string) => {
  try {
    const channel = user.replace('@', '')
    const clips = await getClips(channel)

    const clipsArray = clips.map((clip) => {
      return thumbnailToUrl(clip.thumbnailUrl, '360')
    })

    if (clipsArray.length > 0) {
      Event.emit(Events.onShoutout, new onShoutoutEvent(user, clipsArray))
    } else {
      Event.emit(Events.toSay, new toSayEvent(`${user} doesn't have clips`))
    }
  } catch (err) {
    console.error(err)
  }
}

const BRB = async (user: any, cursor: string) => {
  try {
    const clips = await getClips(user, 100, cursor)
    let clipArr: clipObject[]

    for (const clip of clips) {
      clipArr.push({
        title: clip.title,
        clip: thumbnailToUrl(clip.thumbnailUrl, '360')
      })
    }

    return clipArr
  } catch (err) {
    return err
  }
}

const dance = (multiplier = 1) => Math.random() < (0.25 * multiplier)

const whatGame = async (channel: string) => {
  const user = await api.kraken.channels.getChannel(channel)
  return user.game
}

const getUserPicture = async (user: string) => {
  const data = await api.helix.users.getUserByName(user)
  return data.profilePictureUrl
}

const getChatInfo = async (user: string) => {
  const data = await api.kraken.users.getChatInfo(user)
  return data
}

const getFollowers = async (user: UserIdResolvable) => {
  const data = await api.helix.users.getFollows({
    followedUser: user
  })
  return data
}

export {
  shoutout,
  dance,
  BRB,
  whatGame,
  getUserPicture,
  getChatInfo,
  getFollowers
}