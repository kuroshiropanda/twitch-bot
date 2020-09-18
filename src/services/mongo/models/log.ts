import mongoose, { Schema } from 'mongoose'

const logSchema = new Schema({
    channel: String,
    user: String,
    msg: String,
    date: Date
})

export const LogModel = mongoose.model('Logs', logSchema)