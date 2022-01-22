export const discord = {
  clientId: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  redirectURI: process.env.DISCORD_CALLBACK_URI,
  publicKey: process.env.DISCORD_PUBLIC_KEY,
  botToken: process.env.DISCORD_BOT_TOKEN,
  channels: {
    live: process.env.DISCORD_CHANNEL_LIVE,
    chat: process.env.DISCORD_CHANNEL_CHAT,
    screenshot: process.env.DISCORD_CHANNEL_SCREENSHOT,
    clip: process.env.DISCORD_CHANNEL_CLIP
  }
}
