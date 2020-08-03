import { protocol } from "socket.io-client"

declare let process: {
    env: {
        OBS_ADDRESS: string,
        OBS_PASSWORD: string
    }
}

interface obsObj {
    address: string;
    password: string;
}

export const OBS: obsObj = {
    address: process.env.OBS_ADDRESS,
    password: process.env.OBS_PASSWORD
}