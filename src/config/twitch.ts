declare let process: {
    env: {
        CHANNEL: string,
        TWITCH_CLIENT_ID: string,
        TWITCH_CLIENT_SECRET: string,
        TWITCH_CALLBACK_URI: string
    }
}

interface clientObj {
    channel: string
    clientId: string
    clientSecret: string
    redirectURI: string
    scopes: Array<string>
}

export const twitch: clientObj = {
    channel: process.env.CHANNEL,
    clientId: process.env.TWITCH_CLIENT_ID,
    clientSecret: process.env.TWITCH_CLIENT_SECRET,
    redirectURI: process.env.TWITCH_CALLBACK_URI,
    scopes: [
        'bits:read',
        'channel:moderate',
        'channel:edit:commercial',
        'channel:read:hype_train',
        'channel:read:subscriptions',
        'channel:read:redemptions',
        'clips:edit',
        'chat:edit',
        'chat:read',
        'user:edit',
        'user:edit:broadcast',
        'user:read:broadcast',
        'user:read:email',
        'channel_commercial',
        'channel_editor',
        'channel_feed_edit',
        'channel_feed_read',
        'channel_subscriptions'
    ]
}