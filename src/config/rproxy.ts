declare let process: {
  env: {
    DOMAIN: string,
    APP_PATH: string,
    APP_URL: string,
    PORT: number,
    EVENTSUB_PORT: number,
    EVENTSUB_PATH: string
  }
}

export type reverseProxyConfig = {
  domain: string
  path: string
  url: string
  port: number
  eventsubPort: number
  eventsubPath: string
}

export const reverseProxy: reverseProxyConfig = {
  domain: process.env.DOMAIN,
  path: process.env.APP_PATH,
  url: process.env.APP_URL,
  port: process.env.PORT,
  eventsubPort: process.env.EVENTSUB_PORT,
  eventsubPath: process.env.EVENTSUB_PATH
}