import { promises as fs } from 'fs'
import { StaticAuthProvider, RefreshableAuthProvider, AccessToken } from 'twitch-auth'
import { AuthProvider } from 'twitch-auth/lib'

import { twitch } from '@config'
import { JSONData } from '@twitch'

export class Auth {

  private _id: string
  private _username: string
  private _token: string
  private _refreshToken: string
  private _expiry: number

  private file: string
  private tempData: JSONData

  constructor(json: string) {
    this.file = json
    this.tempData = {
      id: '',
      username: '',
      token: '',
      refreshToken: '',
      expiry: 0
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
      id: this.id,
      username: this.username,
      token: this.token,
      refreshToken: this.refreshToken,
      expiry: this.expiry
    }

    await this.writeFile(data)
  }

  public async AuthProvider(): Promise<AuthProvider> {
    const json = await this.readFile()
    return new RefreshableAuthProvider(
      new StaticAuthProvider(twitch.clientId, json.token), {
      clientSecret: twitch.clientSecret,
      refreshToken: json.refreshToken,
      expiry: json.expiry === null ? null : new Date(json.expiry),
      onRefresh: (token) => this.ClientOnRefresh(token)
    })
  }

  private async ClientOnRefresh(token: AccessToken): Promise<void> {
    const file: JSONData = await this.readFile()
    file.token = token.accessToken
    file.refreshToken = token.refreshToken
    file.expiry = token.expiryDate === null ? null : token.expiryDate.getTime()

    await this.writeFile(file)
  }

  public async readFile(): Promise<JSONData> {
    try {
      const data = JSON.parse(await fs.readFile(this.file, 'utf-8'))
      return data
    } catch (e) {
      return this.tempData
    }
  }

  public async writeFile(data: JSONData): Promise<void> {
    await fs.writeFile(this.file, JSON.stringify(data, null, 2), 'utf-8')
  }
}