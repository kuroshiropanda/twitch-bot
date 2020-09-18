import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    twitchId: Number,
    username: String,
    name: String,
    email: String,
    token: String,
    refreshToken: String,
    expiry: Number
})

export const UserModel = mongoose.model('User', userSchema)

// export const user = {
//     create: (data: object) => {
//         const usr = new UserModel(data)
//         usr.save().then(() => console.log('user created'))
//     },

//     read: (data: object) => {
//         UserModel.find(data, (err, res) => {
//             if (err) return console.error(err)
//             return res
//         })
//     },

//     update: (data: object) => {
//         UserModel.findByIdAndUpdate()

//     },

//     delete: (data: object) => {

//     }
// }