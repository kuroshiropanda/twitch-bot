import OBSWebSocket from 'obs-websocket-js'
import { promises as fs } from 'fs'
import { HelixCustomRewardRedemptionTargetStatus } from 'twitch/lib'

import { Scenes } from './scenes'
import { AudioDevice } from './audio'

import { obs, twitch } from '@config'
import { Rewards } from '@twitch'
import { Event, Events } from '@events'
import {
  onRedeemEvent,
  onOutroEvent,
  onScreenshotEvent,
  onBRBEvent,
  onHostEvent,
  onRewardCompleteEvent,
  onCreateClipEvent,
  toUpdateRewardEvent
} from '@models'
import { Logger } from '@logger'


export type SwitchScenesData = {
  'scene-name': string
  sources: OBSWebSocket.SceneItem[]
}

export type SceneItemVisibilityChangedData = {
  'scene-name': string
  'item-name': string
  'item-id': number
  'item-visible': boolean
}

export class OBSController {

  private obs: OBSWebSocket
  private currentScene: string
  private stopStream: any
  private _connected: boolean
  private _user: string

  constructor() {
    this.obs = new OBSWebSocket({ captureRejections: true })
    this.connected = false
    this._user = twitch.channel

    this.obs.on('ConnectionClosed', () => this.disconnect())
    this.obs.on('StreamStarted', () => this.started())
    this.obs.on('SwitchScenes', (data: SwitchScenesData) => this.onChangeScene(data['scene-name']))
    this.obs.on('SceneItemVisibilityChanged', (data: SceneItemVisibilityChangedData) => this.onItemVisibilityChange(data))

    Event.addListener(Events.onChannelRedeem, (data: onRedeemEvent) => this.onRedeem(data))
  }

  private get scene() {
    return this.currentScene
  }

  private set scene(scene: string) {
    this.currentScene = scene
  }

  private get timeout() {
    return this.stopStream
  }

  private set timeout(x: any) {
    this.stopStream = x
  }

  private get connected() {
    return this._connected
  }

  private set connected(connected: boolean) {
    this._connected = connected
  }

  public async connect() {
    if (!this.connected || this.connected === undefined) {
      await this.obs.connect({
        address: obs.address,
        password: obs.password
      })
      this.connected = true
      console.log('OBSWEBSocket: connected ' + this.connected)
    }
  }

  private emit(event: Events, payload?: any) {
    Event.emit(event, payload)
  }

  private async disconnect() {
    this.obs.disconnect()
    this.obs.removeAllListeners()
    this.connected = false
    console.log('OBSWEBSocket: connected ' + this.connected)
  }

  private async started() {
    this.setCurrentScene(Scenes.intro)
    this.setSourceVisibility(Scenes.intro, 'intro songs', true)
    this.setSourceVisibility(Scenes.intro, 'start websocket', false)
  }

  private async onChangeScene(scene: string) {
    switch (scene) {
      case Scenes.outro:
        const status = await this.obs.send('GetStreamingStatus')
        this.emit(Events.onOutro, new onOutroEvent(status.streaming))
        this.setSourceVisibility(Scenes.outro, 'outro songs', true)
        break
      case Scenes.brb:
        this.mute()
        this.emit(Events.onBRB, new onBRBEvent('ad', twitch.channel))
        break
      default:
        this.unmute()
        break
    }
  }

  private async onItemVisibilityChange(data: SceneItemVisibilityChangedData) {
    if (data['scene-name'] === Scenes.IRL && data['item-name'] === 'webcam') {
      const enable = data['item-visible']
      this.emit(Events.toUpdateReward, new toUpdateRewardEvent(data, this._user, [Rewards.toBeContinued, Rewards.timeWarp], { isEnabled: enable }))
    }
  }

  private onRedeem(redeem: onRedeemEvent) {
    switch (redeem.rewardId) {
      case Rewards.toBeContinued:
        this.tbc(redeem)
        break
      case Rewards.silence:
        this.silence(redeem)
        break
      case Rewards.stopStream:
        this.stop(redeem)
        break
      case Rewards.cancelStop:
        this.stopCancel(redeem)
        break
      case Rewards.screenshot:
        this.screenCapture(redeem)
        break
      case Rewards.timeWarp:
        this.timeWarp(redeem.user, redeem)
        break
      default:
        break
    }
  }

  private async tbc(data: onRedeemEvent) {
    const scene = await this.getCurrentScene()
    this.setCurrentScene(Scenes.freeze)

    setTimeout(() => this.freezeVintage(true), 3800)
    setTimeout(() => this.setCurrentScene(scene), 12000)
    setTimeout(() => {
      this.freezeVintage(false)
      this.rewardComplete(data.channel, data.rewardId, data.id, 'FULFILLED')
    }, 13000)
  }

  private async timeWarp(user: string, data: onRedeemEvent) {
    this.setFilterVisibility('webcam', 'Time Warp Scan', true)

    setTimeout(() => this.screenshot(data, 'webcam'), 11000)
    setTimeout(() => {
      this.setFilterVisibility('webcam', 'Time Warp Scan', false)
      this.emit(Events.onCreateClip, new onCreateClipEvent(user, data.channel))
    }, 15000)
  }

  private async screenCapture(screenshot: onRedeemEvent) {
    const currentScene = await this.getCurrentScene()
    this.screenshot(screenshot, currentScene)
  }

  private async silence(data: onRedeemEvent) {
    await this.setMute(AudioDevice.mic, true)

    setTimeout(async () => {
      await this.setMute(AudioDevice.mic, false)
      this.rewardComplete(data.channel, data.rewardId, data.id, 'FULFILLED')
    }, 30000)
  }

  private async stop(data: onRedeemEvent) {
    const scene = await this.getCurrentScene()
    this.scene = scene

    this.setSourceVisibility(Scenes.outro, 'stop stream', true)
    await this.setCurrentScene(Scenes.outro)

    this.timeout = setTimeout(async () => {
      await this.obs.send('StopStreaming')
    }, 120 * 1000)

    this.rewardComplete(data.channel, data.rewardId, data.id, 'FULFILLED')
  }

  private async stopCancel(data: onRedeemEvent) {
    await this.obs.send('SetCurrentScene', {
      'scene-name': this.scene ? this.scene : Scenes.display
    })
    this.setSourceVisibility(Scenes.outro, 'stop stream', false)
    clearTimeout(this.timeout)

    this.rewardComplete(data.channel, data.rewardId, data.id, 'FULFILLED')
  }

  private async mute() {
    this.setMute(AudioDevice.audio1, true)
    this.setMute(AudioDevice.mic, true)
  }

  private async unmute() {
    this.setMute(AudioDevice.audio1, false)
    this.setMute(AudioDevice.mic, false)
  }

  private async getCurrentScene() {
    const scene = await this.obs.send('GetCurrentScene')
    return scene.name
  }

  private async setCurrentScene(scene: string) {
    await this.obs.send('SetCurrentScene', {
      'scene-name': scene
    })
  }

  private async freezeVintage(bool: boolean) {
    await this.setFilterVisibility('IRL', 'Vintage', bool)
    await this.setFilterVisibility('IRL', 'Freeze', bool)
  }

  private async setFilterVisibility(source: string, filter: string, enabled: boolean) {
    await this.obs.send('SetSourceFilterVisibility', {
      sourceName: source,
      filterName: filter,
      filterEnabled: enabled
    })
  }

  private async getMute(source: string) {
    const mute = await this.obs.send('GetMute', {
      source: source
    })

    return mute.muted
  }

  private async setMute(source: string, bool: boolean) {
    await this.obs.send('SetMute', {
      source: source,
      mute: bool
    })
  }

  private async screenshot(screenshot: onRedeemEvent, source: string) {
    let complete: HelixCustomRewardRedemptionTargetStatus
    try {
      const filePath = `./images/${ new Date().toISOString().replace(/:/gi, '-') }.png`

      const img = await this.obs.send('TakeSourceScreenshot', {
        sourceName: source,
        embedPictureFormat: 'png',
        compressionQuality: -1,
      })

      const image = img.img.replace(/^data:image\/png;base64,/, '')
      const buffer = Buffer.from(image, 'base64')
      await fs.writeFile(filePath, buffer, 'base64')

      this.emit(Events.onScreenshot, new onScreenshotEvent(screenshot.user, filePath))
      complete = 'FULFILLED'
    } catch (err) {
      new Logger(err, 'error')
      complete = 'CANCELED'
    }

    this.rewardComplete(screenshot.channel, screenshot.rewardId, screenshot.id, complete)
  }

  private async setSourceVisibility(scene: string, source: string, visible: boolean) {
    await this.obs.send('SetSceneItemProperties', {
      'scene-name': scene,
      item: {
        name: source
      },
      visible: visible,
      bounds: {},
      crop: {},
      position: {},
      scale: {},
    })
  }

  private rewardComplete(channelId: string, rewardId: string, redemptionId: string, complete: HelixCustomRewardRedemptionTargetStatus) {
    this.emit(Events.onRewardComplete, new onRewardCompleteEvent(channelId, rewardId, redemptionId, complete))
  }
}