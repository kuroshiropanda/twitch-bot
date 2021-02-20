import Discord, { APIMessageContentResolvable, Client, MessageAdditions, MessageEmbed, MessageOptions, TextChannel } from 'discord.js'

import { discord } from '@config'
import { Event, Events } from '@events'
import {
  onScreenshotEvent,
  onClipEvent,
  onChatEvent,
  toSayEvent,
  toPostLiveEvent
} from '@models'
import { getFollowers, getUserPicture } from 'common'

export class DiscordHandler {
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

    Event.addListener(Events.toPostLive, (data: toPostLiveEvent) => this.onLive(data))
    Event.addListener(Events.onChat, (data: onChatEvent) => this.onChat(data))
    Event.addListener(Events.onScreenshot, (data: onScreenshotEvent) => this.onScreenshot(data))
    Event.addListener(Events.onClip, (data: onClipEvent) => this.onClip(data))
  }

  private emit(event: Events, payload: any) {
    Event.emit(event, payload)
  }

  private async onMessage(msg: Discord.Message) {
    if (!msg.author.bot && msg.channel.id === discord.channels.chat) {
      this.emit(Events.toSay, new toSayEvent(`${ msg.author.username }: ${ msg.content } sent via Discord`))
    }
  }

  private async onLive(stream: toPostLiveEvent) {
    const user = await stream.getUser()
    const game = await stream.getGame()
    const tags = await stream.getTags()
    const followers = await getFollowers(user.id)
    const url = `https://twitch.tv/${ user.name }`
    const tagsString = tags.length !== 0 ? tags.map(tag => tag.getName('en-us')).join(', ') : 'none'
    const gameThumbnail = game !== null ? game.boxArtUrl.replace('-{width}x{height}', '') : 'https://static-cdn.jtvnw.net/ttv-static/404_boxart.jpg'

    const msg = new MessageEmbed()
      .setColor('#FF0000')
      .setTitle(stream.title)
      .setDescription(`**${ user.name }** is live [click here to watch](${ url })`)
      .setImage(stream.thumbnail)
      .setThumbnail(gameThumbnail)
      .addField('Playing', game.name)
      .addField('Viewers', stream.viewers, true)
      .addField('Followers', followers.total, true)
      .addField('Subscribers', stream.totalSubs, true)
      .addField('Current Stream Tags', tagsString)
      .setFooter(`${ user.name } is live`, user.profilePictureUrl)
      .setTimestamp(stream.startDate)

    this.sendMsg(discord.channels.live, msg)
  }

  private async onChat(chat: onChatEvent) {
    const msg = new MessageEmbed()
      .setAuthor(chat.userInfo.displayName, await getUserPicture(chat.user), `https://twitch.tv/${ chat.user }`)
      .setColor(chat.userInfo.color)
      .setDescription(chat.message)
      .setTimestamp(new Date())
    this.sendMsg(discord.channels.chat, msg)
  }

  private async onScreenshot(screenshot: onScreenshotEvent) {
    const msg = {
      content: `screenshot redeemed by **${ screenshot.user }**`,
      files: [{
        attachment: screenshot.file
      }]
    }

    this.sendMsg(discord.channels.screenshot, msg)
  }

  private async onClip(clip: onClipEvent) {
    const broadcaster = await clip.getBroadcaster()
    const game = await clip.getGame()
    const msg = new MessageEmbed()
      .setImage(clip.thumbnailUrl)
      .setURL(clip.url)
      .setTitle(clip.title)
      .setDescription(clip.url)
      .setThumbnail(game.boxArtUrl.replace('-{width}x{height}', ''))
      .addField('Playing', game.name, true)
      .addField('Clipped by', clip.user, true)
      .setTimestamp(clip.creationDate)
      .setFooter(`${ broadcaster.name }'s clips`, broadcaster.profilePictureUrl)
    this.sendMsg(discord.channels.clip, msg)
  }

  private async sendMsg(channel: string, msg: APIMessageContentResolvable | (MessageOptions & { split?: false }) | MessageAdditions) {
    const text = this.client.channels.cache.get(channel) as TextChannel
    text.send(msg)
  }
}