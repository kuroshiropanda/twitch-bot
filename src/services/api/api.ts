import { ApiClient } from 'twitch'
import { ClientCredentialsAuthProvider } from 'twitch-auth'
import { twitch } from '../../config/twitch'

const auth = new ClientCredentialsAuthProvider(twitch.clientId, twitch.clientSecret)
const api = new ApiClient({ authProvider: auth, initialScopes: twitch.scopes })

export { api }