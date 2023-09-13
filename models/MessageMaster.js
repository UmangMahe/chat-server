const mongoose = require('mongoose')
const {isEmail} = require('validator')

const MessageMasterSchema = new mongoose.Schema(
    {
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Conversation',
            required: [true, 'Conversation Id is required'],
            index: {unique: true}
        },
        
        messages: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message',
            default: [],
            index: {unique: true}
        }]
        
    },
    {
        timestamps: true,
        versionKey: false,
    }
)

module.exports = mongoose.model('MessageMaster', MessageMasterSchema, 'messages_master')