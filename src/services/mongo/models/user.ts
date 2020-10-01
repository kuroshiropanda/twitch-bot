import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    twitchId: Number,
    username: String,
    name: String,
    email: String,
    token: String,
    refreshToken: String,
    expiry: Number,
    streamlabs: {
        token: String,
        refreshToken: String,
        socketToken: String
    }
})

export const UserModel = mongoose.model('User', userSchema)