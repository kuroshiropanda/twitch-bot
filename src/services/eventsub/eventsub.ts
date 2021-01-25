import { UserIdResolvable } from 'twitch'
import { EventSubListener, ReverseProxyAdapter } from 'twitch-eventsub'
import { EventSubConfig } from 'twitch-eventsub/lib/EventSubListener'
import { EventSubChannelHypeTrainBeginEvent } from 'twitch-eventsub/lib/Events/EventSubChannelHypeTrainBeginEvent'
import { EventSubChannelHypeTrainProgressEvent } from 'twitch-eventsub/lib/Events/EventSubChannelHypeTrainProgressEvent'
import { EventSubChannelHypeTrainEndEvent } from 'twitch-eventsub/lib/Events/EventSubChannelHypeTrainEndEvent'
import { EventSubStreamOnlineEvent } from 'twitch-eventsub/lib/Events/EventSubStreamOnlineEvent'
import { EventSubStreamOfflineEvent } from 'twitch-eventsub/lib/Events/EventSubStreamOfflineEvent'
import { EventSubChannelFollowEvent } from 'twitch-eventsub/lib/Events/EventSubChannelFollowEvent'
import { EventSubChannelRedemptionUpdateEvent } from 'twitch-eventsub/lib/Events/EventSubChannelRedemptionUpdateEvent'

import { api } from '../api'
import { Event, Events } from '../events'
import { twitch } from '../../config'
import { onStreamLiveEvent, onStreamOfflineEvent, toSayEvent } from '../../models'

export default class EventSub {
  private eventsub: EventSubListener
  private adapter: ReverseProxyAdapter
  private config: EventSubConfig

  private id: UserIdResolvable

  constructor(userId: UserIdResolvable) {
    this.adapter = new ReverseProxyAdapter({
      hostName: process.env.REVERSE_PROXY
    })

    this.config = {
      logger: {
        name: 'eventsub',
        minLevel: 'DEBUG',
        colors: true,
        emoji: true,
        timestamps: true
      }
    }

    this.eventsub = new EventSubListener(api, this.adapter, twitch.secret, this.config)
    this.id = userId
  }

  public async init() {
    try {
      await this.eventsub.listen(42394)
      await this.eventsub.subscribeToStreamOnlineEvents(this.id, (data: EventSubStreamOnlineEvent) => this.streamOnline(data))
      await this.eventsub.subscribeToStreamOfflineEvents(this.id, (data: EventSubStreamOfflineEvent) => this.streamOffline(data))
      await this.eventsub.subscribeToChannelFollowEvents(this.id, (data: EventSubChannelFollowEvent) => this.onFollow(data))

      await this.eventsub.subscribeToChannelHypeTrainBeginEvents(this.id, (data: EventSubChannelHypeTrainBeginEvent) => this.hypeTrainBegin(data))
      await this.eventsub.subscribeToChannelHypeTrainProgressEvents(this.id, (data: EventSubChannelHypeTrainProgressEvent) => this.hypeTrainProgress(data))
      await this.eventsub.subscribeToChannelHypeTrainEndEvents(this.id, (data: EventSubChannelHypeTrainEndEvent) => this.hypeTrainEnd(data))

      await this.eventsub.subscribeToChannelRedemptionUpdateEvents(this.id, (data: EventSubChannelRedemptionUpdateEvent) => this.onRedemptionUpdate(data))
    } catch (err) {
      console.error(err)
    }
  }

  public async stop() {
    try {
      await this.eventsub.unlisten()
    } catch (err) {
      console.error(err)
    }
  }

  private emit(event: Events, payload: any) {
    Event.emit(event, payload)
  }

  private async streamOnline(data: EventSubStreamOnlineEvent) {
    this.emit(Events.onStreamLive, new onStreamLiveEvent(data))
  }

  private async streamOffline(data: EventSubStreamOfflineEvent) {
    this.emit(Events.onStreamOffline, new onStreamOfflineEvent(data))
  }

  private async onFollow(data: EventSubChannelFollowEvent) {
    console.log(`${data.userName}[${data.userId}] just followed ${data.broadcasterName}[${data.broadcasterId}]`)
  }

  private async hypeTrainBegin(data: EventSubChannelHypeTrainBeginEvent) {
    this.emit(Events.toSay, new toSayEvent(`Hype Train Started POGGERS reach levels and unlock streamer dares and/or rewards (not monetary)`))
  }

  private async hypeTrainProgress(data: EventSubChannelHypeTrainProgressEvent) {
    this.emit(Events.toSay, new toSayEvent(`to reach our next goal we need ${data.goal}, we currently have a total of ${data.total}`))
  }

  private async hypeTrainEnd(data: EventSubChannelHypeTrainEndEvent) {
    this.emit(Events.toSay, new toSayEvent(`Hype Train just ended another hype train can start at ${data.cooldownEndDate}`))
    this.emit(Events.toSay, new toSayEvent(`Hype Train ended at level ${data.level} and the top contributors are:`))
    for (let contrib of data.topContributions) {
      this.emit(Events.toSay, new toSayEvent(`${contrib.user_login} with ${contrib.total} ${contrib.type}`))
    }
  }

  private async onRedemptionUpdate(data: EventSubChannelRedemptionUpdateEvent) {
    const user = await data.getUser()
    let msg: string
    switch(data.status) {
      case 'FULFILLED':
        msg = `${data.rewardTitle} has been successfully redeemed, @${user.name} your points are spent and cannot be refunded back`
        break
      case 'CANCELLED':
        msg = `${data.rewardTitle} has failed, @${user.name} your points have been refunded`
        break
      default:
        msg = `${data.rewardTitle} has failed, @${user.name} your points have been refunded`
        break
    }

    this.emit(Events.toSay, new toSayEvent(msg))
  }
}