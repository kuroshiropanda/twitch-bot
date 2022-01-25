import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
const env = dotenv.config()
dotenvExpand.expand(env)

import { startApp } from './app'

startApp()
