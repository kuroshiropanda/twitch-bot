export type twitchConfig = {
  channel: string
  clientId: string
  clientSecret: string
  redirectURI: string
  secret: string
  scopes: string[]
  botScopes: string[]
}

export const twitch: twitchConfig = {
  channel: process.env.CHANNEL,
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
    'user_blocks_read'
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
  ]
}