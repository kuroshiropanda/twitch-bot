import api from './services/api'

import { onShoutoutEvent, toSayEvent } from './models'
import { Event, Events } from './services/events'

const shoutout = async (user: string) => {
  try {
    const userId = await api.kraken.users.getUserByName(user)
    const clips = await api.helix.clips.getClipsForBroadcaster(userId.id, {
      limit: 50
    })
    
    const clipsArray = clips.data.map(clip => {
      const AT = /AT-cm%7C/g
      if (AT.test(clip.thumbnailUrl)) {
        return `${clip.thumbnailUrl.replace('-preview-480x272.jpg', '-360.mp4')}`
      } else {
        return `${clip.thumbnailUrl.replace('twitch.tv/', 'twitch.tv/AT-cm%7C').replace('-preview-480x272.jpg', '-360.mp4')}`
      }
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

const dance = (multiplier: number = 1) => Math.random() < (0.25 * multiplier)

export { shoutout, dance }