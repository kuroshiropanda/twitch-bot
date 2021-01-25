import axios from 'axios'
import { Manager } from 'socket.io-client'
import fs, { promises as fsp } from 'fs'

import { streamlabs } from '../../config'
import { onDonateEvent, onOutroEvent } from '../../models'
import { Event, Events } from '../events'
import { donateData } from './donate'

export default class Streamlabs {

  private streamlabs: Manager
  private token: string

  constructor(socket: string, token: string) {
    this.streamlabs = new Manager('https://sockets.streamlabs.com', {
      transports: ['websocket'],
      query: {
        token: socket
      }
    })
    this.token = token
  }

  public async init() {
    this.streamlabs.connect((e) => console.error(e))
    this.streamlabs.on('connect', () => console.log('Streamlabs socket: connected'))
    this.streamlabs.on('event', (data: donateData) => {
      if (data.type === 'donation') {
        Event.emit(Events.onDonate, new onDonateEvent(data))
      }
    })

    Event.addListener(Events.onOutro, (data: onOutroEvent) => this.endCredits(data))
  }

  private async endCredits(event: onOutroEvent) {
    if (event.outro) {
      try {
        const data = await axios.post('https://streamlabs.com/api/v1.0/credits/roll', {
          access_token: this.token
        })
        console.log('streamlabs credits: ' + data)
      } catch (err) {
        console.error(err.response.data)
      }
    }
  }

  private async alerts() {
    try {
      await axios.post('https://streamlabs.com/api/v1.0/alerts', {
        access_token: this.token,
        type: 'donation',
        message: 'Test alert',
        duration: '8000'
      })
    } catch (err) {
      console.error(err.response)
    }
  }

  public static async getToken(code: any) {
    const data: object[] = []
    try {
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

      data.push(token.data, socket.data)
    } catch (err) {
      return err.response
    }

    return data
  }

  public static async readJSON(file: string) {
    if (!fs.existsSync(file)) {
      await fsp.writeFile(file, JSON.stringify({
        token: '',
        refreshToken: '',
        expiry: null
      }), 'utf-8')
    }

    const data = JSON.parse(await fsp.readFile(file, { encoding: 'utf-8' }))
    return data
  }
}