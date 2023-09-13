const mongoose = require('mongoose')
const { isEmail } = require('validator')

const MessageSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Users',
            required: [true, 'Sender is required']
        },
        message: {
            type: String,
            required: [true, 'Message is required']
        },
        sent: {
            type: Boolean,
            default: true,
        },
        seen: {
            type: Boolean,
            default: false,
            required: [true, 'Seen is required']
        },
        type: {
            default: 'text',
            type: String
        }

    },
    {
        timestamps: true,
        versionKey: false,
    }
)

module.exports = mongoose.model('Message', MessageSchema)