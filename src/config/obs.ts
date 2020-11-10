declare let process: {
  env: {
    OBS_ADDRESS: string
    OBS_PASSWORD: string
  }
}

interface obsObj {
  address: string
  password: string
}

export const obs: obsObj = {
  address: process.env.OBS_ADDRESS,
  password: process.env.OBS_PASSWORD
}