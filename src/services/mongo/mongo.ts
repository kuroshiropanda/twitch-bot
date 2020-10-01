import mongoose from 'mongoose'
import { UserModel } from './models/user'
import { BotModel } from './models/bot'
import { LogModel } from './models/log'
import { mongo } from '../../config/mongo'

(async () => {
  try {
    await mongoose.connect(mongo.url, {
      user: mongo.user,
      pass: mongo.pass,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false
    })
  } catch (err) {
    console.log(err)
  }

  const db = mongoose.connection
  db.on('error', () => console.log('cant connect to db'))
  db.once('open', () => console.log('mongodb connected'))
})()

export class Bot {
  static async create(data: any) {
    await BotModel.findOneAndUpdate({ twitchId: data[1].id },
      {
        username: data[1].login,
        name: data[1].display_name,
        token: data[0].access_token,
        refreshToken: data[0].refresh_token,
        expiry: data[0].expires_in
      },
      { upsert: true }).exec()
  }

  static async read(data: any) {
    const bot = await BotModel.findOne({ username: data.username }).exec()
    return bot
  }

  static async update(data: any) {
    await BotModel.findOneAndUpdate({ twitchId: data.twitchId }, {
      token: data.accessToken,
      refreshToken: data.refreshToken,
      expiry: data.expiryDate
    }).exec()
  }

  static async delete(data: any) {

  }
}

export class User {
  static async readAll() {
    return await UserModel.find({}, 'username').exec()
  }

  static async create(data: any) {
    await UserModel.findOneAndUpdate({ twitchId: data[1].id },
      {
        username: data[1].login,
        name: data[1].display_name,
        email: data[1].email,
        token: data[0].access_token,
        refreshToken: data[0].refresh_token,
        expiry: data[0].expires_in
      },
      { upsert: true }).exec()
  }

  static async read(data: any) {
    const user = await UserModel.findOne({ username: data.username }).exec()
    return user
  }

  static async update(data: any) {
    await UserModel.findOneAndUpdate({ twitchId: data.twitchId }, {
      token: data.accessToken,
      refreshToken: data.refreshToken,
      expiry: data.expiryDate
    }).exec()
  }

  static async addStreamlabs(data: any) {
    await UserModel.findOneAndUpdate({ twitchId: data.twitchId }, {
      streamlabs: {
        token: data.token,
        refreshToken: data.refresh_token,
        socketToken: data.socket_token
      }
    }).exec()
  }
}

export class Log {
  private data: object

  constructor(data: object) {
    this.data = data
  }

  async save() {
    const log = new LogModel(this.data)
    log.save()
    console.log(this.data)
  }
}