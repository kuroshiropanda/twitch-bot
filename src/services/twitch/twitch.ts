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
}