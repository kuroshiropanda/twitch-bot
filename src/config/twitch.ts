if (!process.env.TWITCH_CLIENT_ID) {
  throw 'Missing Twitch Client ID'
}

if (!process.env.TWITCH_CLIENT_SECRET) {
  throw 'Missing Twitch Client Secret'
}

if (!process.env.TWITCH_CALLBACK_URI) {
  throw 'Missing Twitch Callback URI'
}

export const twitch = {
  clientId: process.env.TWITCH_CLIENT_ID,
  clientSecret: process.env.TWITCH_CLIENT_SECRET,
  redirectURI: process.env.TWITCH_CALLBACK_URI,
  secret: process.env.EVENTSUB_SECRET,
  scopes: [
    'bits:read',
    'channel:moderate',
    'channel:edit:commercial',
    'channel:manage:broadcast',
    'channel:manage:redemptions',
    'channel:read:hype_train',
    'channel:read:redemptions',
    'channel:read:subscriptions',
    'chat:edit',
    'chat:read',
    'clips:edit',
    'moderation:read',
    'user:edit',
    'user:edit:broadcast',
    'user:edit:follows',
    'user:read:broadcast',
    'user:read:email',
    'channel_subscriptions',
    'channel_commercial',
    'channel_editor',
    'user_read',
    'user_blocks_read',
  ],
  botScopes: [
    'channel:moderate',
    'chat:edit',
    'chat:read',
    'whispers:read',
    'whispers:edit',
    'channel:edit:commercial',
    'channel:manage:broadcast',
    'clips:edit',
    'channel_commercial',
    'channel_editor',
  ],
}
