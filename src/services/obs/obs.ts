import OBSWebSocket from 'obs-websocket-js'
import { OBS } from '../../config/obs'
import Streamlabs from '../streamlabs/streamlabs'

export default class obsWS {

    private obs: any
    private currentScene: string
    private stopStream: any

    constructor() {
        this.obs = new OBSWebSocket()
        this.currentScene = ''
        this.stopStream
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
                address: OBS.address,
                password: OBS.password
            })
            console.log('OBSWEBSocket: connected')
        } catch (err) {
            console.log(err)
        }

        this.obs.on('SwitchScenes', (data: any) => {
            if (data.sceneName === 'outro') {
                Streamlabs.credits()
            }
        })

        this.obs.on('error', (err: any) => {
            throw err
        })
    }

    async tbc() {
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

    async silence() {
        this.obs.send('ToggleMute', {
            source: 'mic'
        })

        setTimeout(() => {
            this.obs.send('ToggleMute', {
                source: 'mic'
            })
        }, 30000)
    }

    async stop() {
        this.obs.send('GetCurrentScene').then((data: any) => {
            this.scene = data.name
        })

        this.obs.send('SetCurrentScene', {
            'scene-name': 'outro'
        })

        // Streamlabs.credits()

        this.timeout = setTimeout(() => {
            this.obs.send('StopStreaming')
        }, 120 * 1000)
    }

    async stopCancel() {
        this.obs.send('SetCurrentScene', {
            'scene-name': this.scene ? this.scene : 'main display'
        }).catch((e: any) => {
            console.log(e)
        })

        clearTimeout(this.timeout)
    }
}