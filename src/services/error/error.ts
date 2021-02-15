import { Logger } from '@logger'

export class ErrorHandler {
  constructor() {
    process.on('uncaughtException', this.uncaughtException)
    process.on('unhandledRejection', this.unhandledRejection)
  }

  private uncaughtException(error: Error) {
    new Logger(error.stack, 'error')
  }

  private unhandledRejection(reason: any, promise: any) {
    console.error(reason, promise)
    // new Logger(JSON.stringify({reason, promise}), 'error')
  }
}