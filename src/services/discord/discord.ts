import { discord } from '@config'
import { Event, Events } from '@events'
import {
  onChatEvent,
  onClipEvent,
  onScreenshotEvent,
  toPostLiveEvent,
  toSayEvent,
} from '@models'
import { clientApi } from '@twitch'
import Discord, {
  Client,
  ColorResolvable,
  Intents,
  MessageEmbed,
  MessageOptions,
  MessagePayload,
} from 'discord.js'
import { ActivityTypes } from 'discord.js/typings/enums'

export class DiscordHandler {
  private client: Client

  constructor() {
    this.client = new Client({
      intents: Intents.FLAGS.GUILD_INTEGRATIONS,
      presence: {
        status: 'dnd',
        activities: [
          {
            name: 'kuroshiropanda on twitch',
            type: ActivityTypes.WATCHING,
            url: 'https://twitch.tv/kuroshiropanda',
          },
        ],
      },
    })
  }

  public async init() {
    this.client.once('ready', () => {
      console.log('Discord: ready')
    })

    this.client.login(discord.botToken)
    this.client.on('message', (msg: Discord.Message) => this.onMessage(msg))

    Event.addListener(Events.toPostLive, (data: toPostLiveEvent) =>
      this.onLive(data)
    )
    Event.addListener(Events.onChat, (data: onChatEvent) => this.onChat(data))
    Event.addListener(Events.onScreenshot, (data: onScreenshotEvent) =>
      this.onScreenshot(data)
    )
    Event.addListener(Events.onClip, (data: onClipEvent) => this.onClip(data))
  }

  private emit(event: Events, payload: any) {
    Event.emit(event, payload)
  }

  private async onMessage(msg: Discord.Message) {
    if (!msg.author.bot && msg.channel.id === discord.channels.chat) {
      this.emit(
        Events.toSay,
        new toSayEvent(
          `${msg.author.username}: ${msg.content} sent via Discord`
        )
      )
    }
  }

  private async onLive(stream: toPostLiveEvent) {
    const user = await stream.getUser()
    const game = await stream.getGame()
    const tags = await stream.getTags()
    const followers = await clientApi.users.getFollows({
      followedUser: user?.id,
    })
    const url = `https://twitch.tv/${user?.name}`
    const tagsString =
      tags.length !== 0
        ? tags.map(tag => tag.getName('en-us')).join(', ')
        : 'none'
    const gameThumbnail =
      game !== null
        ? game.boxArtUrl.replace('-{width}x{height}', '')
        : 'https://static-cdn.jtvnw.net/ttv-static/404_boxart.jpg'

    const msg = new MessageEmbed()
      .setColor('#FF0000')
      .setTitle(stream.title)
      .setDescription(`**${user?.name}** is live [click here to watch](${url})`)
      .setImage(stream.thumbnail)
      .setThumbnail(gameThumbnail)
      .addField('Playing', `${game?.name}`)
      .addField('Viewers', `${stream.viewers}`, true)
      .addField('Followers', `${followers.total}`, true)
      .addField('Subscribers', stream.totalSubs, true)
      .addField('Current Stream Tags', tagsString)
      .setFooter({
        text: `${user?.name} is live`,
        iconURL: user?.profilePictureUrl,
      })
      .setTimestamp(stream.startDate)

    this.sendMsg(discord.channels.live as string, { embeds: [msg] })
  }

  private async onChat(chat: onChatEvent) {
    const chatUser = await clientApi.users.getUserByName(chat.user)
    const iconURL = chatUser?.profilePictureUrl
    const msg = new MessageEmbed()
      .setAuthor({
        name: chat.userInfo.displayName,
        url: `https://twitch.tv/${chat.user}`,
        iconURL,
      })
      .setColor(chat.userInfo.color as ColorResolvable)
      .setDescription(chat.message)
      .setTimestamp(new Date())
    this.sendMsg(discord.channels.chat as string, { embeds: [msg] })
  }

  private async onScreenshot(screenshot: onScreenshotEvent) {
    const msg = {
      content: `screenshot redeemed by **${screenshot.user}**`,
      files: [
        {
          attachment: screenshot.file,
        },
      ],
    }

    this.sendMsg(discord.channels.screenshot as string, msg)
  }

  private async onClip(clip: onClipEvent) {
    const broadcaster = await clip.getBroadcaster()
    const game = await clip.getGame()
    const msg = new MessageEmbed()
      .setImage(clip.thumbnailUrl)
      .setURL(clip.url)
      .setTitle(clip.title)
      .setDescription(clip.url)
      .setThumbnail(game?.boxArtUrl.replace('-{width}x{height}', '') as string)
      .addField('Playing', `${game?.name}`, true)
      .addField('Clipped by', clip.user, true)
      .setTimestamp(clip.creationDate)
      .setFooter({
        text: `${broadcaster?.name}'s clips`,
        iconURL: broadcaster?.profilePictureUrl,
      })
    this.sendMsg(discord.channels.clip as string, { embeds: [msg] })
  }

  private async sendMsg(
    channel: string,
    msg: string | MessageOptions | MessagePayload
  ) {
    const text = await this.client.channels.fetch(channel)
    if (text && text.isText()) text.send(msg)
  }
}
