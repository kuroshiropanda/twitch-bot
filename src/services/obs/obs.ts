import OBSWebSocket from 'obs-websocket-js'
import { OBS } from '../../config/obs'

const obs = new OBSWebSocket()

(async() => {
    obs.connect({
        address: OBS.address,
        password: OBS.password
    }).then(() => {
        console.log(`OBSWEBSocket: Success! We're connected & authenticated.`)
    }).catch(err => {
        console.log(err)
    })
})()

export const obsControl = {
    tbc: () => {
        obs.send('GetCurrentScene').then(data => {
            obs.send('SetCurrentScene', {
                "scene-name": 'freeze frame'
            })
    
            setTimeout(() => {
                obs.send('SetSourceFilterVisibility', {
                    sourceName: 'IRL',
                    filterName: 'Freeze',
                    filterEnabled: true
                })
    
                obs.send('SetSourceFilterVisibility', {
                    sourceName: 'IRL',
                    filterName: 'Vintage',
                    filterEnabled: true
                })
            }, 3800)
    
            setTimeout(() => {
                obs.send('SetCurrentScene', {
                    'scene-name': data.name
                })
            }, 12000)
    
            setTimeout(() => {
                obs.send('SetSourceFilterVisibility', {
                    sourceName: 'IRL',
                    filterName: 'Freeze',
                    filterEnabled: false
                })
    
                obs.send('SetSourceFilterVisibility', {
                    sourceName: 'IRL',
                    filterName: 'Vintage',
                    filterEnabled: false
                })
            }, 13000)
        })
    }
}