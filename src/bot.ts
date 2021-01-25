import { promises as fs } from 'fs'
import { StaticAuthProvider, RefreshableAuthProvider } from 'twitch-auth'
import { AuthProvider } from 'twitch-auth/lib'

import { twitch } from './config'
import { JSONData } from './services/twitch'

export default class Bot {

  private _id: string
  private _username: string
  private _token: string
  private _refreshToken: string
  private _expiry: number

  constructor(data?: JSONData) {
    if (data) {
      this._token = data.token
      this._refreshToken = data.refreshToken
      this._expiry = data.expiry
    }
  }

  get id() {
    return this._id
  }

  set id(id: string) {
    this._id = id
  }

  get username() {
    return this._username
  }

  set username(username: string) {
    this._username = username
  }

  get token() {
    return this._token
  }

  set token(token: string) {
    this._token = token
  }

  get refreshToken() {
    return this._refreshToken
  }

  set refreshToken(refresh: string) {
    this._refreshToken = refresh
  }

  get expiry() {
    return this._expiry
  }

  set expiry(expiry: number) {
    this._expiry = expiry
  }

  public async save() {
    const data = {
      id: this._id,
      username: this._username,
      token: this._token,
      refreshToken: this._refreshToken,
      expiry: this._expiry
    }

    try {
      await fs.writeFile('bot.json', JSON.stringify(data), 'utf-8')
      return true
    } catch (err) {
      console.error(err)
      return false
    }
  }

  public AuthProvider(): AuthProvider {
    return new RefreshableAuthProvider(
      new StaticAuthProvider(twitch.clientId, this.token, twitch.botScopes), {
      clientSecret: twitch.clientSecret,
      refreshToken: this.refreshToken,
      expiry: this.expiry === null ? null : new Date(this.expiry),
      onRefresh: this.ClientOnRefresh
    })
  }

  private async ClientOnRefresh({ accessToken, refreshToken, expiryDate }) {
    const file: JSONData = JSON.parse(await fs.readFile('bot.json', { encoding: 'utf-8' }))
    file.token = accessToken
    file.refreshToken = refreshToken
    file.expiry = expiryDate === null ? null : expiryDate.getTime()

    await fs.writeFile('bot.json', JSON.stringify(file, null, 2), 'utf-8')
  }
}