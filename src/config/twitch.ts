declare let process: {
    env: {
        TWITCH_CLIENT_ID: string,
        TWITCH_CLIENT_SECRET: string,
        TWITCH_CALLBACK_URI: string
    }
}

interface clientObj {
    clientId: string;
    clientSecret: string;
    redirectURI: string;
}

export const twitch: clientObj = {
    clientId: process.env.TWITCH_CLIENT_ID,
    clientSecret: process.env.TWITCH_CLIENT_SECRET,
    redirectURI: process.env.TWITCH_CALLBACK_URI
}

export const scopes: Array<string> = [
    'bits:read',
    'channel:edit:commercial',
    'channel:moderate',
    'channel:read:subscriptions',
    'channel:read:redemptions',
    'clips:edit',
    'chat:edit',
    'chat:read',
    'user:edit:broadcast',
    'channel_commercial',
    'channel_subscriptions',
    'channel_editor'
]

export const channelList: Array<string> = [
    'kuroshiropanda'
]