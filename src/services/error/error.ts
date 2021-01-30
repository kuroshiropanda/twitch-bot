export default class ErrorHandling {
  constructor() {
    process.on('uncaughtException', (error) => this.uncaughtException(error))
    process.on('unhandledRejection', (reason: any, promise: any) => this.unhandledRejection(reason, promise))
  }

  private uncaughtException(error: Error) {
    console.error(error)
  }

  private unhandledRejection(reason: any, promise: any) {
    console.error(reason, promise)
  }
}