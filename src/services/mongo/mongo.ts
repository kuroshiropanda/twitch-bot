import mongoose from 'mongoose'
import { UserModel } from './models/user'
import { BotModel } from './models/bot'
import { mongo } from '../../config/mongo'

(async () => {
    try {
        await mongoose.connect(mongo.url, {
            user: mongo.user,
            pass: mongo.pass,
            useNewUrlParser: true,
            useUnifiedTopology: true
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
        const bot = new BotModel(data)
        bot.save().then(() => console.log('user created'))
    }

    static async read(data: any) {
        const bot = await BotModel.findOne({ twitchId: data.twitchId }).exec()
        return bot
    }

    static async update(data: any) {
        const bot = BotModel.findOneAndUpdate({ twitchId: data.twitchId }, {
            token: data.accessToken,
            refreshToken: data.refreshToken,
            expiry: data.expiryDate
        })
        bot.exec()
    }

    static async delete(data: any) {

    }
}

export class User {
    static async readAll() {
        return await UserModel.find({}, 'username').exec()
    }

    static async create(data: object) {
        const user = new UserModel(data)
        user.save().then(() => console.log('user created'))
    }

    static async read() {

    }

    static async update() {

    }

    static async delete() {

    }
}