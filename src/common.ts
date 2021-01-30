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

const getClips = async (name: string, limit: number = 50, date?: { start?: string, end?: string }) => {
  try {
    let startDate: string
    let endDate: string
    if (date === undefined) {
      startDate = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString()
      endDate = new Date().toISOString()
    } else {
      startDate = date.start
      endDate = date.end
    }
    const user = await api.helix.users.getUserByName(name)
    const clips = await api.helix.clips.getClipsForBroadcaster(user, {
      startDate,
      endDate,
      limit
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

const dance = (multiplier = 1) => Math.random() < (0.25 * multiplier)

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

const getChannelName = async (id: UserIdResolvable) => {
  const data = await api.helix.users.getUserById(id)
  return data.name
}

export {
  shoutout,
  dance,
  getUserPicture,
  getChatInfo,
  getFollowers,
  getChannelName
}