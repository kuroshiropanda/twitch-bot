import { ApiClient } from 'twitch'
import { ClientCredentialsAuthProvider } from 'twitch-auth'
import { twitch } from '../../config/twitch'

const authProvider = new ClientCredentialsAuthProvider(twitch.clientId, twitch.clientSecret)
const api = new ApiClient({ authProvider })

export { api }