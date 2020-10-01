import axios from 'axios'
import io from 'socket.io-client'

import { streamlabs } from '../../config'
import { onDonateEvent, onOutroEvent } from '../../models'
import { Event, Events } from '../events'
import { donateData } from './donate'

export default class Streamlabs {

  private streamlabs: SocketIOClient.Socket
  private token: string

  constructor(token: string, socket: string) {
    this.streamlabs = io(`https://sockets.streamlabs.com`, {
      transports: ['websocket'],
      query: {
        token: socket
      }
    })
    this.token = token
  }

  async init() {
    this.streamlabs.on('event', (data: donateData) => {
      if (data.type === 'donation') {
        Event.emit(Events.onDonate, new onDonateEvent(data))
      }
    })

    Event.addListener(Events.onOutro, (onOutroEvent: onOutroEvent) => this.endCredits(onOutroEvent))
  }

  private async endCredits(event: onOutroEvent) {
    if (event.outro) {
      try {
        await axios.post('https://streamlabs.com/api/v1.0/credits/roll', {
          access_token: this.token
        })
      } catch (err) {
        console.error(err.response)
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
    let data: object[] = []
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
}