import axios from 'axios'
import io from 'socket.io-client'
import { promises as fs } from 'fs'
import { streamlabs } from '../../config/streamlabs'

export default class Streamlabs {

    private socket: string

    constructor(socket: string) {
        this.socket = socket
    }

    async init() {
        return io(`https://sockets.streamlabs.com`, {
            transports: ['websocket'],
            query: {
                token: await Streamlabs.token()
            }
        })
    }

    private static async token() {
        const data = JSON.parse(await fs.readFile('./streamlabs.json', { encoding: 'utf8' }))
        return data.access_token
    }

    static async getToken(code: any) {
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

            return token.data
        } catch (err) {
            return err
        }
    }

    static async credits() {
        try {
            await axios.post('https://streamlabs.com/api/v1.0/credits/roll', {
                access_token: await this.token()
            })
        } catch (err) {
            throw err.data.message
        }
    }

    static async alerts() {
        try {
            await axios.post('https://streamlabs.com/api/v1.0/alerts', {
                access_token: await this.token(),
                type: 'donation',
                message: 'Test alert',
                duration: '8000'
            })
        } catch (err) {
            throw err.data.message
        }
    }

    static async testAlert() {
        try {
            axios.post('https://streamlabs.com/api/v1.0/alerts/send_test_alert', {
                access_token: await this.token(),
                type: 'donation',
                platform: 'twitch'
            })
        } catch (err) {
            throw err.data.message
        }
    }
}