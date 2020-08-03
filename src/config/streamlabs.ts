interface SLObject {
    SLClientId: string | undefined;
    SLClientSecret: string | undefined;
    SLRedirectUri: string | undefined;
}

export const streamlabs: SLObject = {
    SLClientId: process.env.SL_CLIENT_ID,
    SLClientSecret: process.env.SL_CLIENT_SECRET,
    SLRedirectUri: process.env.SL_CALLBACK_URI
}

export const scopes: Array<string> = [
    'donations.create',
    'donations.read',
    'alerts.create',
    'socket.token',
    'points.read',
    'points.write',
    'alerts.write',
    'credits.write'
]