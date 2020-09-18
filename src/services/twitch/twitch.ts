import axios from 'axios'

import { twitch } from '../../config/twitch'
import { User } from '../mongo/mongo'

export default class Twitch {
    static async getToken(code: any) {
        let data: Array<object> = []
        try {
            const token = await axios({
                method: 'POST',
                url: 'https://id.twitch.tv/oauth2/token',
                params: {
                    client_id: twitch.clientId,
                    client_secret: twitch.clientSecret,
                    code: code,
                    grant_type: 'authorization_code',
                    redirect_uri: twitch.redirectURI
                }
            })

            const user = await axios({
                method: 'GET',
                url: 'https://api.twitch.tv/helix/users',
                headers: {
                    'Client-ID': twitch.clientId,
                    'Authorization': `Bearer ${token.data.access_token}`
                }
            })

            data.push(token.data, user.data.data[0])
        } catch (err) {
            return err
        }
        return data
    }

    static async getAppToken() {
        const appToken = await axios({
            method: 'POST',
            url: 'https://id.twitch.tv/oauth2/token',
            params: {
                client_id: twitch.clientId,
                client_secret: twitch.clientSecret,
                grant_type: 'client_credentials',
                scope: twitch.scopes.join(' ')
            }
        })

        return appToken.data.access_token
    }

    static async getUsers() {
        return (await User.readAll()).map((user: any) => user.username)
    }

    static async updateStream(id: string, token: string, title: string) {
        const res = await axios({
            method: 'PATCH',
            url: 'https://api.twitch.tv/helix/channels',
            headers: {
                'client-id': twitch.clientId,
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            data: {
                broadcaster_id: id,
                title: title
            }
        })

        console.log(res.status)
    }

    static async getUserId(user: string) {
        try {
            const userId = await axios({
                method: 'GET',
                url: 'https://api.twitch.tv/helix/users',
                headers: {
                    'client-id': twitch.clientId,
                    Authorization: `Bearer ${await Twitch.getAppToken()}`
                },
                params: {
                    login: user
                }
            })
            
            return userId.data
        } catch (err) {
            console.log(err.response)

            return false
        }
    }

    static async getRandomClip(id: string) {
        try {
            const clips = await axios({
                url: 'https://api.twitch.tv/helix/clips',
                method: 'GET',
                headers: {
                    'client-id': twitch.clientId,
                    Authorization: `Bearer ${await Twitch.getAppToken()}`
                },
                params: {
                    broadcaster_id: id
                }
            })

            return clips.data.data.map((clip: any) => {
                const AT = /AT-cm%7C/g
                if (AT.test(clip.thumbnail_url)) {
                    return `${clip.thumbnail_url.replace('-preview-480x272.jpg', '-480.mp4')}`
                } else {
                    return `${clip.thumbnail_url.replace('twitch.tv/', 'twitch.tv/AT-cm%7C').replace('-preview-480x272.jpg', '-480.mp4')}`
                }
            })
        } catch (err) {
            console.log(err)

            return false
        }
    }
}