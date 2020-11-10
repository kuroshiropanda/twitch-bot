declare let process: {
  env: {
    DISCORD_CLIENT_ID: string
    DISCORD_CLIENT_SECRET: string
    DISCORD_CALLBACK_URI: string
    DISCORD_PUBLIC_KEY: string
    DISCORD_BOT_TOKEN: string
    DISCORD_CHANNEL_CHAT: string
    DISCORD_CHANNEL_SCREENSHOT: string
    DISCORD_CHANNEL_CLIP: string
  }
}

interface clientObj {
  clientId: string
  clientSecret: string
  redirectURI: string
  publicKey: string
  botToken: string
  channels: {
    chat: string
    screenshot: string
    clip: string
  }
}

export const discord: clientObj = {
  clientId: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  redirectURI: process.env.DISCORD_CALLBACK_URI,
  publicKey: process.env.DISCORD_PUBLIC_KEY,
  botToken: process.env.DISCORD_BOT_TOKEN,
  channels: {
    chat: process.env.DISCORD_CHANNEL_CHAT,
    screenshot: process.env.DISCORD_CHANNEL_SCREENSHOT,
    clip: process.env.DISCORD_CHANNEL_CLIP
  }
}