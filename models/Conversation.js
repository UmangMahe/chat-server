const mongoose = require('mongoose')
const { isEmail } = require('validator')

const ConversationSchema = new mongoose.Schema(
    {
        members: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Users',
            required: [true, 'Members are required']
        }]
    },

    {
        timestamps: true
    }
)

module.exports = mongoose.model('Conversation', ConversationSchema)