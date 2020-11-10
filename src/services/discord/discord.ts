import Discord, { Client, MessageEmbed, TextChannel } from 'discord.js'

import { discord } from '../../config'
import { onScreenshotEvent, onClipEvent, onChatEvent, toSayEvent } from '../../models'
import { getUserPicture } from '../../common'
import { Event, Events } from '../events'

export default class DiscordHandler {
  private client: Client

  constructor() {
    this.client = new Discord.Client({
      presence: {
        status: 'dnd',
        activity: {
          name: 'kuroshiropanda on twitch',
          type: 'WATCHING',
          url: 'https://twitch.tv/kuroshiropanda'
        }
      }
    })
  }

  public async init() {
    this.client.once('ready', () => {
      console.log('Discord: ready')
    })

    this.client.login(discord.botToken)

    this.client.on('message', (msg: Discord.Message) => this.onMessage(msg))

    Event.addListener(Events.onChat, (onChatEvent: onChatEvent) => this.onChat(onChatEvent))
    Event.addListener(Events.onScreenshot, (onScreenshotEvent: onScreenshotEvent) => this.onScreenshot(onScreenshotEvent))
    Event.addListener(Events.onClip, (onClipEvent: onClipEvent) => this.onClip(onClipEvent))
  }

  private emit(event: Events, payload: any) {
    Event.emit(event, payload)
  }

  private async onMessage(msg: Discord.Message) {
    if (!msg.author.bot && msg.channel.id === discord.channels.chat) {
      this.emit(Events.toSay, new toSayEvent(`${msg.author.username}: ${msg.content} sent via Discord`))
    }
  }

  private async onChat(chat: onChatEvent) {
    try {
      const channel = this.client.channels.cache.get(discord.channels.chat) as TextChannel
      const msg = new MessageEmbed()
        .setAuthor(chat.userInfo.displayName, await getUserPicture(chat.user), `https://twitch.tv/${chat.user}`)
        .setColor(chat.userInfo.color)
        .setDescription(chat.message)
        .setTimestamp(new Date())
      channel.send(msg)
    } catch (err) {
      console.error(err)
    }
  }

  private async onScreenshot(onScreenshotEvent: onScreenshotEvent) {
    try {
      const screenshot = this.client.channels.cache.get(discord.channels.screenshot) as TextChannel
      screenshot.send({
        files: [{
          attachment: onScreenshotEvent.file
        }]
      })
    } catch (err) {
      console.error(err)
    }
  }

  private async onClip(onClipEvent: onClipEvent) {
    try {
      const clip = this.client.channels.cache.get(discord.channels.clip) as TextChannel
      clip.send(onClipEvent.url)
    } catch (err) {
      console.error(err)
    }
  }
}