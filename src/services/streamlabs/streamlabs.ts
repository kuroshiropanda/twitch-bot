import axios, { AxiosInstance } from 'axios'
import { Manager } from 'socket.io-client'
import { promises as fs } from 'fs'

import { donateData } from './donate'

import { streamlabs, file } from '@config'
import { Event, Events } from '@events'
import {
  onDonateEvent,
  onOutroEvent
} from '@models'

const tempData = {
  'token': '',
  'refreshToken': '',
  'expiry': 0,
  'socket': ''
}

export class Streamlabs {

  private streamlabs: Manager
  private axios: AxiosInstance
  private token: string

  constructor(socket: string, token: string) {
    this.streamlabs = new Manager('https://sockets.streamlabs.com', {
      transports: ['websocket'],
      query: {
        token: socket
      }
    })
    this.token = token

    this.axios = axios.create({
      baseURL: 'https://streamlabs.com/api/v1.0/'
    })
  }

  public async init() {
    this.streamlabs.open()
    this.streamlabs.on('error', (e: any) => console.error('Streamlabs socket connection error', e))
    // this.streamlabs.on('event', (data: donateData) => {
    //   if (data.type === 'donation') {
    //     Event.emit(Events.onDonate, new onDonateEvent(data))
    //   }
    // })

    Event.addListener(Events.onOutro, (data: onOutroEvent) => this.endCredits(data))
  }

  private async endCredits(event: onOutroEvent) {
    if (event.outro) {
      const data = await this.axios.post('credits/roll', { access_token: this.token })
      console.info('streamlabs credits: ', data.data)
    }
  }

  public static async getToken(code: any) {
    const token = await axios({
      method: 'POST',
      url: 'https://streamlabs.com/api/v1.0/token',
      data: {
        client_id: streamlabs.clientId,
        client_secret: streamlabs.clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: streamlabs.redirectURI
      }
    })

    const socket = await axios({
      method: 'GET',
      url: 'https://streamlabs.com/api/v1.0/socket/token',
      params: {
        access_token: token.data.access_token
      }
    })

    return {
      token: token.data,
      socket: socket.data
    }
  }

  public static async readJSON() {
    try {
      return JSON.parse(await fs.readFile(file.streamlabs, 'utf-8'))
    } catch (e) {
      return tempData
    }
  }

  public static async createFile() {
    await fs.writeFile(file.streamlabs, JSON.stringify(tempData, null, 2), 'utf-8')
  }
}