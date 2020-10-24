import OBSWebSocket from 'obs-websocket-js'

import { obs, twitch } from '../../config'
import { onRedeemEvent, onBRBEvent, onOutroEvent } from '../../models'
import { Rewards } from '../pubsub'
import { Event, Events } from '../events'
import { Scenes } from './scenes'

export default class obsController {

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

  async connect() {
    try {
      await this.obs.connect({
        address: obs.address,
        password: obs.password
      })
      console.log('OBSWEBSocket: connected')
    } catch (err) {
      console.log(err)
    }

    this.obs.on('SwitchScenes', (data: any) => this.onChangeScene(data.sceneName))

    Event.addListener(Events.onChannelRedeem, (onRedeem: onRedeemEvent) => this.onRedeem(onRedeem))
  }

  private emit(event: Events, payload?: any) {
    Event.emit(event, payload)
  }

  private async onChangeScene(scene: string) {
    switch(scene) {
      case Scenes.outro:
        this.emit(Events.onOutro, new onOutroEvent(true))
        break
      case Scenes.brb:
        this.mute()
        break
      default:
        this.unmute()
        break
    }
  }

  private onRedeem(onRedeem: onRedeemEvent) {
    switch(onRedeem.reward.rewardId) {
      case Rewards.toBeContinued:
        this.tbc()
        break
      case Rewards.silence:
        this.silence()
        break
      case Rewards.stopStream:
        this.stop()
        break
      case Rewards.cancelStop:
        this.stopCancel()
        break
      default:
        break
    }
  }

  private async tbc() {
    const scene = await this.getCurrentScene()
    this.setCurrentScene(Scenes.freeze)

    setTimeout(() => {
      this.freezeVintage(true)
    }, 3800)

    setTimeout(() => {
      this.setCurrentScene(scene)
    }, 12000)

    setTimeout(() => {
      this.freezeVintage(false)
    }, 13000)
  }

  private async silence() {
    await this.setMute('mic', true)

    setTimeout(async () => {
      await this.setMute('mic', false)
    }, 30000)
  }

  private async stop() {
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
  }

  private stopCancel() {
    this.obs.send('SetCurrentScene', {
      'scene-name': this.scene ? this.scene : 'main display'
    }).catch((e) => console.log(e))

    clearTimeout(this.timeout)
    console.log(this.timeout)
  }

  private async mute() {
    this.setMute('earphones', true)
    this.setMute('mic', true)
  }

  private async unmute() {
    this.setMute('earphones', false)
    this.setMute('mic', false)
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
    try {
      this.obs.send('SetSourceFilterVisibility', {
        sourceName: 'IRL',
        filterName: 'Freeze',
        filterEnabled: bool
      })

      this.obs.send('SetSourceFilterVisibility', {
        sourceName: 'IRL',
        filterName: 'Vintage',
        filterEnabled: bool
      })
    } catch (err) {
      console.error(err)
    }
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
}