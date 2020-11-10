import { ApiClient } from 'twitch'

import { toSayEvent, onSetGameEvent, onCreateClipEvent, onClipEvent, onBRBEvent } from '../../models'
import { Event, Events } from '../events'

export default class apiHandler {
  private api: ApiClient

  constructor(api: ApiClient) {
    this.api = api
  }

  public async init() {
    Event.addListener(Events.onSetGame, (onSetGameEvent: onSetGameEvent) => this.onSetGame(onSetGameEvent))
    Event.addListener(Events.onCreateClip, (onCreateClipEvent: onCreateClipEvent) => this.onClip(onCreateClipEvent))
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
      this.emit(Events.toSay, new toSayEvent(`Successfully changed game to ${event.game}`))
    } else {
      this.emit(Events.toSay, new toSayEvent(`${event.game} is not a correct twitch category, please try again`))
    }
  }

  private async onClip(event: onCreateClipEvent) {
    const clip = await this.api.helix.clips.createClip({
      channelId: event.channel,
      createAfterDelay: true
    })
    const url = `https://clips.twitch.tv/${clip}`

    this.emit(Events.toSay, new toSayEvent(url))
    this.emit(Events.onClip, new onClipEvent(url))
  }
}