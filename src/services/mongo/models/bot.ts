import mongoose, { Schema } from 'mongoose'

const botSchema = new Schema({
    twitchId: String,
    username: String,
    name: String,
    token: String,
    refreshToken: String,
    expiry: Number
})

export const BotModel = mongoose.model('Bot', botSchema)