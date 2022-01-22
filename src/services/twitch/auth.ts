import { twitch } from '@config'
import { JSONData } from '@twitch'
import { AccessToken, RefreshingAuthProvider } from '@twurple/auth'
import { AuthProvider } from '@twurple/auth/lib'
import { promises as fs } from 'fs'

export class Auth {
  private _id!: string
  private _username!: string
  private _token!: string
  private _refreshToken!: string
  private _expiry!: number
  private _timestamp!: number
  private _scopes!: string[]

  private file: string

  constructor(json: string) {
    this.file = json
  }

  get id(): string {
    return this._id
  }

  set id(id: string) {
    this._id = id
  }

  get username(): string {
    return this._username
  }

  set username(username: string) {
    this._username = username
  }

  get token(): string {
    return this._token
  }

  set token(token: string) {
    this._token = token
  }

  get refreshToken(): string {
    return this._refreshToken
  }

  set refreshToken(refresh: string) {
    this._refreshToken = refresh
  }

  get expiry(): number {
    return this._expiry
  }

  set expiry(expiry: number) {
    this._expiry = expiry
  }

  get timestamp(): number {
    return this._timestamp
  }

  set timestamp(timestamp: number) {
    this._timestamp = timestamp
  }

  get scopes(): string[] {
    return this._scopes
  }

  set scopes(scopes: string[]) {
    this._scopes = scopes
  }

  public async save(): Promise<void> {
    const data: JSONData = {
      id: this.id,
      username: this.username,
      accessToken: this.token,
      refreshToken: this.refreshToken,
      expiresIn: this.expiry,
      obtainmentTimestamp: this.timestamp,
      scope: this.scopes,
    }

    await this.writeFile(data)
  }

  public async AuthProvider(): Promise<AuthProvider> {
    const json = await this.readFile()
    return new RefreshingAuthProvider(
      {
        clientId: twitch.clientId,
        clientSecret: twitch.clientSecret,
        onRefresh: async token => this.ClientOnRefresh(token),
      },
      json
    )
  }

  private async ClientOnRefresh(token: AccessToken): Promise<void> {
    const file = await this.readFile()
    file.accessToken = token.accessToken
    file.refreshToken = token.refreshToken
    file.expiresIn = token.expiresIn

    await this.writeFile(file)
  }

  public async readFile(): Promise<JSONData> {
    const data = JSON.parse(await fs.readFile(this.file, 'utf-8'))
    return data
  }

  public async writeFile(data: JSONData): Promise<void> {
    await fs.writeFile(this.file, JSON.stringify(data, null, 2), 'utf-8')
  }
}
