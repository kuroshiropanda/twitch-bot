declare let process: {
    env: {
        MONGODB_URL: string,
        MONGODB_USER: string,
        MONGODB_PASS: string
    }
}

interface mongoObj {
    url: string;
    user: string;
    pass: string;
}

export const mongo = {
    url: process.env.MONGODB_URL,
    user: process.env.MONGODB_USER,
    pass: process.env.MONGODB_PASS
}