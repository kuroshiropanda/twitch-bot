declare let process: {
  env: {
    OBS_ADDRESS: string
    OBS_PASSWORD: string
    OBS_SCREENSHOT: string
  }
}

interface obsObj {
  address: string
  password: string
  screenshot: string
}

export const obs: obsObj = {
  address: process.env.OBS_ADDRESS,
  password: process.env.OBS_PASSWORD,
  screenshot: process.env.OBS_SCREENSHOT
}