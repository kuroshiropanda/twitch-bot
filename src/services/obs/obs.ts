import OBSWebSocket from 'obs-websocket-js'
import { promises as fs } from 'fs'

import { obs, twitch } from '../../config'
import { onRedeemEvent, onOutroEvent, onScreenshotEvent, onBRBEvent, onHostEvent, onRewardCompleteEvent, onCreateClipEvent } from '../../models'
import { Rewards } from '../pubsub'
import { Event, Events } from '../events'
import { Scenes } from './scenes'
import { AudioDevice } from './audio'
import { HelixCustomRewardRedemptionTargetStatus } from 'twitch/lib'

export default class OBSController {

  private obs: OBSWebSocket
  private currentScene: string
  private stopStream: any

  constructor() {
    this.obs = new OBSWebSocket()
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

  public async connect() {
    try {
      await this.obs.connect({
        address: obs.address,
        password: obs.password
      })
      console.log('OBSWEBSocket: connected')
    } catch (err) {
      console.error(err)
    }

    this.obs.on('ConnectionClosed', () => this.obs.disconnect())

    this.obs.on('StreamStarted', () => {
      this.setSourceVisibility('intro songs', true)
      this.setSourceVisibility('start websocket', false)
    })
    this.obs.on('SwitchScenes', (data: any) => this.onChangeScene(data.sceneName))

    Event.addListener(Events.onChannelRedeem, (data: onRedeemEvent) => this.onRedeem(data))
  }

  private emit(event: Events, payload?: any) {
    Event.emit(event, payload)
  }

  private async onChangeScene(scene: string) {
    switch (scene) {
      case Scenes.outro:
        this.emit(Events.onOutro, new onOutroEvent(true))
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
    try {
      const scene = await this.getCurrentScene()
      this.scene = scene

      await this.setCurrentScene(Scenes.outro)
    } catch (err) {
      console.error(err)
    }

    this.timeout = setTimeout(async () => {
      await this.obs.send('StopStreaming')
    }, 120 * 1000)

    this.rewardComplete(data.channel, data.rewardId, data.id, 'FULFILLED')
  }

  private stopCancel(data: onRedeemEvent) {
    this.obs.send('SetCurrentScene', {
      'scene-name': this.scene ? this.scene : Scenes.display
    }).catch((e) => console.error(e))

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
    try {
      const scene = await this.obs.send('GetCurrentScene')
      return scene.name
    } catch (err) {
      console.error(err)
      return undefined
    }
  }

  private async setCurrentScene(scene: string) {
    try {
      await this.obs.send('SetCurrentScene', {
        'scene-name': scene
      })
    } catch (err) {
      console.error(err)
    }
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
    try {
      await this.obs.send('SetMute', {
        source: source,
        mute: bool
      })
    } catch (err) {
      console.error(err)
    }
  }

  private async screenshot(screenshot: onRedeemEvent, source: string) {
    let complete: HelixCustomRewardRedemptionTargetStatus
    try {
      const filePath = `/images/${ new Date().toISOString().replace(/:/gi, '-') }.png`

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
      console.error({ TakeSourceScreenshot: err })
      complete = 'CANCELED'
    }

    this.rewardComplete(screenshot.channel, screenshot.rewardId, screenshot.id, complete)
  }

  private async setSourceVisibility(source: string, visible: boolean) {
    await this.obs.send('SetSceneItemProperties', {
      item: {
        name: source
      },
      visible: visible,
      bounds: null,
      crop: null,
      position: null,
      scale: null,
    })
  }

  private rewardComplete(channelId: string, rewardId: string, redemptionId: string, complete: HelixCustomRewardRedemptionTargetStatus) {
    this.emit(Events.onRewardComplete, new onRewardCompleteEvent(channelId, rewardId, redemptionId, complete))
  }
}