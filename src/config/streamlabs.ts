declare let process: {
  env: {
    SL_CLIENT_ID: string
    SL_CLIENT_SECRET: string
    SL_CALLBACK_URI: string
  }
}

interface SLObject {
  clientId: string
  clientSecret: string
  redirectURI: string
  scopes: Array<string>
}

export const streamlabs: SLObject = {
  clientId: process.env.SL_CLIENT_ID,
  clientSecret: process.env.SL_CLIENT_SECRET,
  redirectURI: process.env.SL_CALLBACK_URI,
  scopes: [
    'donations.create',
    'donations.read',
    'alerts.create',
    'socket.token',
    'points.read',
    'points.write',
    'alerts.write',
    'credits.write'
  ]
}