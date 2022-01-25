import { twitch } from '@config'
import { Event, Events } from '@events'
import {
  onClipEvent,
  onCreateClipEvent,
  onGetGameEvent,
  onPostClipEvent,
  onRedeemEvent,
  onRewardCompleteEvent,
  onSetGameEvent,
  onStreamLiveEvent,
  onStreamOfflineEvent,
  toPostLiveEvent,
  toSayEvent,
  toUpdateRewardEvent,
} from '@models'
import { Steam } from '@steam'
import {
  ApiClient,
  HelixChannel,
  HelixClip,
  HelixCustomRewardRedemptionTargetStatus,
  HelixStream,
  HelixUpdateCustomRewardData,
  HelixUser,
  UserIdResolvable,
} from '@twurple/api'
import { ClientCredentialsAuthProvider } from '@twurple/auth'
import { Rewards } from './rewards'

const authProvider = new ClientCredentialsAuthProvider(
  twitch.clientId,
  twitch.clientSecret
)
export const clientApi = new ApiClient({ authProvider })

export class ApiHandler {
  private api: ApiClient

  constructor(api: ApiClient) {
    this.api = api
  }

  public async init() {
    Event.addListener(Events.onSetGame, (data: onSetGameEvent) =>
      this.onSetGame(data)
    )
    Event.addListener(Events.onGetGame, (data: onGetGameEvent) =>
      this.onGetGame(data)
    )
    Event.addListener(Events.onCreateClip, (data: onCreateClipEvent) =>
      this.onClip(data)
    )
    Event.addListener(Events.onPostClip, (data: onPostClipEvent) =>
      this.onPostClip(data)
    )
    Event.addListener(Events.onStreamLive, (data: onStreamLiveEvent) =>
      this.onStreamLive(data)
    )
    Event.addListener(Events.onStreamOffline, (data: onStreamOfflineEvent) =>
      this.onStreamOffline(data)
    )
    Event.addListener(Events.onRewardComplete, (data: onRewardCompleteEvent) =>
      this.onRewardComplete(data)
    )
    Event.addListener(Events.onChannelRedeem, (data: onRedeemEvent) =>
      this.onRedeem(data)
    )
    Event.addListener(Events.toUpdateReward, (data: toUpdateRewardEvent) =>
      this.toUpdateReward(data)
    )
  }

  private emit(event: Events, payload: any) {
    Event.emit(event, payload)
  }

  private async onSetGame(event: onSetGameEvent) {
    const game = await this.api.games.getGameByName(event.game)

    if (game) {
      await this.api.channels.updateChannelInfo(event.channel as string, {
        gameId: game.id,
      })
      this.emit(
        Events.toSay,
        new toSayEvent(`Successfully changed game to ${game.name}`)
      )
    } else {
      this.emit(
        Events.toSay,
        new toSayEvent(
          `${event.game} is not a correct twitch category, please try again`
        )
      )
    }
  }

  private async onGetGame(data: onGetGameEvent) {
    const stream = (await this.api.channels.getChannelInfo(
      data.channelId as string
    )) as HelixChannel
    const steam = await Steam.getGameUrl(stream?.gameName as string)

    this.emit(
      Events.toSay,
      new toSayEvent(
        `@${data.user}, ${data.channel} is currently playing ${stream.gameName}. ${steam}`
      )
    )
  }

  private async onClip(event: onCreateClipEvent) {
    const clip = await this.api.clips.createClip({
      channelId: event.channel as string,
      createAfterDelay: true,
    })
    const url = `https://clips.twitch.tv/${clip}`
    const editUrl = `https://clips.twitch.tv/${clip}/edit`

    this.emit(
      Events.toSay,
      new toSayEvent(
        `@${event.user}, here's the clip: ${url} if you want to edit it go here: ${editUrl}`
      )
    )
    setTimeout(async () => {
      const clipData = (await this.api.clips.getClipById(clip)) as HelixClip
      this.emit(Events.onClip, new onClipEvent(event.user, clipData))
    }, 5000)
  }

  private async onPostClip(event: onPostClipEvent) {
    const clip = (await this.api.clips.getClipById(event.clipId)) as HelixClip

    if (clip.broadcasterDisplayName === twitch.channel) {
      this.emit(Events.onClip, new onClipEvent(event.user, clip))
    }
  }

  private async onStreamLive(data: onStreamLiveEvent) {
    const stream = (await this.api.streams.getStreamByUserId(
      data.broadcasterId
    )) as HelixStream
    const subs = await this.api.subscriptions.getSubscriptions(
      data.broadcasterId
    )

    this.emit(Events.toPostLive, new toPostLiveEvent(stream, subs))
  }

  private async onStreamOffline(data: onStreamOfflineEvent) {
    const cost = 50000
    const tiktok = await this.api.channelPoints.getCustomRewardById(
      data.broadcasterId,
      Rewards.tiktok
    )
    if (tiktok?.cost !== cost)
      this.updateReward(data.broadcasterId, Rewards.tiktok, { cost })
  }

  private async onRewardComplete(data: onRewardCompleteEvent) {
    await this.api.channelPoints.updateRedemptionStatusByIds(
      data.channelId,
      data.rewardId,
      [data.redemptionId],
      data.complete
    )
  }

  private async onRedeem(data: onRedeemEvent) {
    if (data.rewardId === Rewards.discount) {
      const reward = await this.updateReward(data.channel, Rewards.tiktok, {
        cost: 25000,
      })
      const complete: HelixCustomRewardRedemptionTargetStatus = reward
        ? 'FULFILLED'
        : 'CANCELED'
      this.emit(
        Events.onRewardComplete,
        new onRewardCompleteEvent(
          data.channel,
          data.rewardId,
          data.id,
          complete
        )
      )
    }
  }

  private async toUpdateReward(data: toUpdateRewardEvent) {
    const user = (await this.api.users.getUserByName(data.user)) as HelixUser
    for (const reward of data.rewardId) {
      this.updateReward(user.id, reward, data.data)
    }
  }

  private async updateReward(
    broadcasterId: UserIdResolvable,
    rewardId: string,
    data: HelixUpdateCustomRewardData
  ) {
    try {
      await this.api.channelPoints.updateCustomReward(
        broadcasterId,
        rewardId,
        data
      )
      return true
    } catch (e) {
      return false
    }
  }
}
