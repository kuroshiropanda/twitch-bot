import axios from 'axios'

import { twitch, scopes } from '../../config/twitch'

export default class Twitch {
    static async getToken(code: any) {
        let data: object = {}
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

            data['token'] = token.data

            const user = await axios({
                method: 'GET',
                url: 'https://api.twitch.tv/helix/users',
                headers: {
                    'Client-ID': twitch.clientId,
                    'Authorization': `Bearer ${token.data.access_token}`
                }
            })

            data['user'] = user.data.data[0]
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
                scope: scopes.join(' ')
            }
        })

        return appToken
    }
}

// axios({
//     method: 'POST',
//     url: `https://id.twitch.tv/oauth2/token`,
//     params: {
//         client_id: twitch.clientId,
//         client_secret: twitch.clientSecret,
//         code: req.query.code,
//         grant_type: 'authorization_code',
//         redirect_uri: twitch.redirectURI
//     }
// }).then((res) => {
//     console.log(res.data)

//     axios({
//         method: 'GET',
//         url: 'https://api.twitch.tv/helix/users',
//         headers: {
//             'Client-ID': twitch.clientId,
//             'Authorization': `Bearer ${res.data.access_token}`
//         }
//     }).then((res) => {
//         console.log(res.data)
//     })
//     // const accessToken = res.data.access_token;
//     // const refreshToken = res.data.refresh_token;
//     // const expiryDate = res.data.expires_in;
//     // const newTokenData = {
//     //     accessToken,
//     //     refreshToken,
//     //     expiryTimestamp: expiryDate
//     // };

//     // db.create({

//     // })
// }).catch((e) => {
//     console.error(e.message)
// })