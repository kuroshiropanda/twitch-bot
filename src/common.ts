import { Event, Events } from '@events'
import { onShoutoutEvent, toSayEvent } from '@models'
import { api } from '@twitch'
import { HelixClip, UserIdResolvable } from '@twurple/api/lib'

export const getClips = async (
  name: string,
  limit = 50,
  date?: { start?: string; end?: string }
): Promise<HelixClip[] | null> => {
  let startDate: string | undefined
  let endDate: string | undefined
  if (date === undefined) {
    startDate = new Date(
      new Date().setDate(new Date().getDate() - 30)
    ).toISOString()
    endDate = new Date().toISOString()
  } else {
    startDate = date.start
    endDate = date.end
  }
  const user = await api.users.getUserByName(name)
  const userId: UserIdResolvable = user?.id as string
  const clips = await api.clips.getClipsForBroadcaster(userId, {
    startDate,
    endDate,
    limit,
  })

  if (!clips.data) return null
  return clips.data
}

export const thumbnailToUrl = (url: string, res: string) => {
  const AT = /AT-cm%7C/g
  if (AT.test(url)) {
    return `${url.replace('-preview-480x272.jpg', `-${res}.mp4`)}`
  } else {
    return `${url
      .replace('twitch.tv/', 'twitch.tv/AT-cm%7C')
      .replace('-preview-480x272.jpg', `-${res}.mp4`)}`
  }
}

export const shoutout = async (user: string) => {
  const channel = user.replace('@', '')
  const clips = await getClips(channel)

  if (clips) {
    const clipsArray = clips.map(clip => {
      return thumbnailToUrl(clip.thumbnailUrl, '360')
    })

    if (clipsArray.length > 0) {
      Event.emit(Events.onShoutout, new onShoutoutEvent(user, clipsArray))
    }
  } else {
    Event.emit(Events.toSay, new toSayEvent(`${user} doesn't have clips`))
  }
}

export const dance = (multiplier = 1) => Math.random() < 0.25 * multiplier
