export type obsConfig = {
  address: string
  password: string
  screenshot: string
}

export const obs: obsConfig = {
  address: process.env.OBS_ADDRESS,
  password: process.env.OBS_PASSWORD,
  screenshot: process.env.OBS_SCREENSHOT
}