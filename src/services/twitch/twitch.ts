import axios from 'axios'
import fs, { promises as fsp } from 'fs'

import { twitch } from '@config'
import { AccessToken } from '@twurple/auth/lib'

export type TokenData = {
  auth: {
    access_token: string
    refresh_token: string
    expires_in: number
    scope: string[]
    token_type: string
  },
  user: {
    id: string
    login: string
    display_name: string
    type: string
    description: string
    profile_image_url: string
    offline_image_url: string
    view_count: number
    created_at: string
  }
}

export interface JSONData extends AccessToken {
  id: string
  username: string
}

export class Twitch {
  static async getToken(code: any): Promise<TokenData> {
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

    const data: TokenData = {
      auth: token.data,
      user: user.data.data[0]
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

  public static async readJSON(file: string) {
    if (!fs.existsSync(file)) {
      await fsp.writeFile(file, JSON.stringify({
        token: '',
        refreshToken: '',
        expiry: null
      }), 'utf-8')
    }

    const data: JSONData = JSON.parse(await fsp.readFile(file, { encoding: 'utf-8' }))
    return data
  }
}
