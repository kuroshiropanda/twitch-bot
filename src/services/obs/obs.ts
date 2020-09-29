import OBSWebSocket from 'obs-websocket-js'

import { Event, Events } from '../events'
import { obs } from '../../config'
import Streamlabs from '../streamlabs/streamlabs'
import { onRedeemEvent } from '../../models'
import { Rewards } from '../pubsub/rewards'

export default class obsController {

    private obs: OBSWebSocket
    private currentScene: string
    private stopStream: any

    constructor() {
        this.obs = new OBSWebSocket()
    }

    get scene() {
        return this.currentScene
    }

    set scene(scene: string) {
        this.currentScene = scene
    }

    get timeout() {
        return this.stopStream
    }

    set timeout(x: any) {
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

        this.obs.on('SwitchScenes', (data: any) => this.onStreamEnd(data.sceneName))

        Event.addListener(Events.onChannelRedeem, (onRedeem: onRedeemEvent) => this.onRedeem(onRedeem))
    }

    private onStreamEnd(scene: string) {
        if (scene === 'outro') {
            Streamlabs.credits()
        }
    }

    private onRedeem(onRedeem: onRedeemEvent) {
        if (onRedeem.reward.rewardId === Rewards.toBeContinued) this.tbc()
        if (onRedeem.reward.rewardId === Rewards.silence) this.silence()
        if (onRedeem.reward.rewardId === Rewards.stopStream) this.stop()
        if (onRedeem.reward.rewardId === Rewards.cancelStop) this.stopCancel()
    }

    tbc() {
        this.obs.send('GetCurrentScene').then(data => {
            this.obs.send('SetCurrentScene', {
                'scene-name': 'freeze frame'
            })

            setTimeout(() => {
                this.obs.send('SetSourceFilterVisibility', {
                    sourceName: 'IRL',
                    filterName: 'Freeze',
                    filterEnabled: true
                })

                this.obs.send('SetSourceFilterVisibility', {
                    sourceName: 'IRL',
                    filterName: 'Vintage',
                    filterEnabled: true
                })
            }, 3800)

            setTimeout(() => {
                this.obs.send('SetCurrentScene', {
                    'scene-name': data.name
                })
            }, 12000)

            setTimeout(() => {
                this.obs.send('SetSourceFilterVisibility', {
                    sourceName: 'IRL',
                    filterName: 'Freeze',
                    filterEnabled: false
                })

                this.obs.send('SetSourceFilterVisibility', {
                    sourceName: 'IRL',
                    filterName: 'Vintage',
                    filterEnabled: false
                })
            }, 13000)
        })
    }

    silence() {
        this.obs.send('ToggleMute', {
            source: 'mic'
        })

        setTimeout(() => {
            this.obs.send('ToggleMute', {
                source: 'mic'
            })
        }, 30000)
    }

    stop() {
        this.obs.send('GetCurrentScene').then((data: any) => {
            this.scene = data.name
        }).catch((e) => console.log(e))

        this.obs.send('SetCurrentScene', {
            'scene-name': 'outro'
        }).catch((e) => console.log(e))

        this.timeout = setTimeout(() => {
            this.obs.send('StopStreaming').catch((e) => console.log(e))
        }, 120 * 1000)
    }

    stopCancel() {
        this.obs.send('SetCurrentScene', {
            'scene-name': this.scene ? this.scene : 'main display'
        }).catch((e) => console.log(e))

        clearTimeout(this.timeout)
        console.log(this.timeout)
    }
}