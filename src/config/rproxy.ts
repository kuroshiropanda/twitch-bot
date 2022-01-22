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

export const reverseProxy = {
  domain: process.env.DOMAIN,
  path: process.env.APP_PATH,
  url: process.env.APP_URL,
  port: process.env.PORT,
  eventsubPort: process.env.EVENTSUB_PORT,
  eventsubPath: process.env.EVENTSUB_PATH
}
