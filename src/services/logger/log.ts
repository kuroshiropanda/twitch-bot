import winston from 'winston'

export class Logger {

  private log: winston.Logger

  constructor(msg: string, lvl: string) {
    this.log = winston.createLogger({
      transports: [
        new winston.transports.Console({
          format: winston.format.colorize()
        }),
        new winston.transports.File({
          filename: './logs/combined.log',
          level: 'info'
        }),
        new winston.transports.File({
          filename: './logs/error.log',
          level: 'error'
        })
      ],
      exitOnError: false
    })

    this.log.log(lvl, msg)
  }

}