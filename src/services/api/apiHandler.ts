import { ApiClient, HelixCustomRewardRedemptionTargetStatus, HelixUpdateCustomRewardData } from 'twitch'
import { twitch } from '../../config'

import { Event, Events } from '../events'
import {
  toSayEvent,
  onSetGameEvent,
  onCreateClipEvent,
  onClipEvent,
  onPostClipEvent,
  onStreamLiveEvent,
  toPostLiveEvent,
  onRewardCompleteEvent,
  onRedeemEvent,
  onStreamOfflineEvent,
  onGetGameEvent
} from '../../models'
import { Rewards } from '../pubsub'
import Steam from '../steam'


export default class ApiHandler {
  private api: ApiClient

  constructor(api: ApiClient) {
    this.api = api
  }

  public async init() {
    Event.addListener(Events.onSetGame, (data: onSetGameEvent) => this.onSetGame(data))
    Event.addListener(Events.onGetGame, (data: onGetGameEvent) => this.onGetGame(data))
    Event.addListener(Events.onCreateClip, (data: onCreateClipEvent) => this.onClip(data))
    Event.addListener(Events.onPostClip, (data: onPostClipEvent) => this.onPostClip(data))
    Event.addListener(Events.onStreamLive, (data: onStreamLiveEvent) => this.onStreamLive(data))
    Event.addListener(Events.onStreamOffline, (data: onStreamOfflineEvent) => this.onStreamOffline(data))
    Event.addListener(Events.onRewardComplete, (data: onRewardCompleteEvent) => this.onRewardComplete(data))
    Event.addListener(Events.onChannelRedeem, (data: onRedeemEvent) => this.onRedeem(data))
  }

  private emit(event: Events, payload: any) {
    Event.emit(event, payload)
  }

  private async onSetGame(event: onSetGameEvent) {
    const game = await this.api.helix.games.getGameByName(event.game)

    if (game) {
      await this.api.kraken.channels.updateChannel(event.channel, {
        game: game.name
      })
      this.emit(Events.toSay, new toSayEvent(`Successfully changed game to ${game}`))
    } else {
      this.emit(Events.toSay, new toSayEvent(`${event.game} is not a correct twitch category, please try again`))
    }
  }

  private async onGetGame(data: onGetGameEvent) {
    const stream = await this.api.helix.channels.getChannelInfo(data.channelId)
    const steam = await Steam.getGameUrl(stream.gameName)

    this.emit(Events.toSay, new toSayEvent(`@${data.user}, ${data.channel} is currently playing ${stream.gameName}. ${steam}`))
  }

  private async onClip(event: onCreateClipEvent) {
    const clip = await this.api.helix.clips.createClip({
      channelId: event.channel,
      createAfterDelay: true
    })
    const url = `https://clips.twitch.tv/${clip}`
    const editUrl = `https://clips.twitch.tv/${clip}/edit`


    this.emit(Events.toSay, new toSayEvent(`@${event.user}, here's the clip: ${url} if you want to edit it go here: ${editUrl}`))
    setTimeout(async () => {
      const clipData = await this.api.helix.clips.getClipById(clip)
      this.emit(Events.onClip, new onClipEvent(event.user, clipData))
    }, 5000)
  }

  private async onPostClip(event: onPostClipEvent) {
    const clip = await this.api.helix.clips.getClipById(event.clipId)

    if (clip.broadcasterDisplayName === twitch.channel) {
      this.emit(Events.onClip, new onClipEvent(event.user, clip))
    }
  }

  private async onStreamLive(data: onStreamLiveEvent) {
    const stream = await this.api.helix.streams.getStreamByUserId(data.broadcasterId)
    const subs = await this.api.helix.subscriptions.getSubscriptions(data.broadcasterId)

    this.emit(Events.toPostLive, new toPostLiveEvent(stream, subs))
  }

  private async onStreamOffline(data: onStreamOfflineEvent) {
    await this.api.helix.channelPoints.updateCustomReward(data.broadcasterId, Rewards.tiktok, { cost: 50000 })
  }

  private async onRewardComplete(data: onRewardCompleteEvent) {
    await this.api.helix.channelPoints.updateRedemptionStatusByIds(data.channelId, data.rewardId, [data.redemptionId], data.complete)
  }

  private async onRedeem(data: onRedeemEvent) {
    if (data.rewardId === Rewards.discount) {
      let complete: HelixCustomRewardRedemptionTargetStatus
      try {
        await this.api.helix.channelPoints.updateCustomReward(data.channel, Rewards.tiktok, { cost: 25000 })
        complete = 'FULFILLED'
      } catch (e) {
        console.error(e)
        complete = 'CANCELED'
      }
      this.emit(Events.onRewardComplete, new onRewardCompleteEvent(data.channel, data.rewardId, data.id, complete))
    }
  }
}