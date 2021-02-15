export type streamlabsConfig = {
  clientId: string
  clientSecret: string
  redirectURI: string
  scopes: string[]
}

export const streamlabs: streamlabsConfig = {
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
    'credits.write',
    'wheel.write'
  ]
}