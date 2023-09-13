const express = require('express');
const ErrorHandler = require('../../../../errors/ErrorHandler');
const router = express.Router()
const auth = require('../../../../middleware/auth')

const Conversation = require('../../../../models/Conversation');
// const Message = require('../../../../models/Message');
const Users = require('../../../../models/Users');
const Friends = require('../../../../models/Friends');
const Profiles = require('../../../../models/Profiles');
const MessageMaster = require('../../../../models/MessageMaster');

// @desc    Conversation Page to create a conversation
// @route   POST /api/conversation

router.post('/', auth.verifyToken, async (req, res) => {

    const { recepient_id } = req.fields;
    if (!recepient_id) return res.status(400).json({ message: 'Recepient Id is required' })
    try {
        const user = await Users.findOne({ _id: recepient_id })
        if (user._id.toString() === req.user.id) {
            return res.status(500).json({
                message: 'Receiver is not valid'
            })
        }
        else if (user) {
            const { id } = req.user
            const existingConversation = await Conversation.findOne({
                members: { $all: [id, user._id.toString()] }
            })

            if (existingConversation) {
                return res.status(200).json({
                    message: 'Conversation',
                    conv_id: existingConversation._id
                })
            }
            else {
                const { _id: receipentProfileId } = await Profiles.findOne({ userId: user._id });
                const newConversation = new Conversation({
                    members: [id, user._id.toString()]
                })
                try {
                    await newConversation.save().then(async savedConversation => {

                        await Profiles.findOne({ userId: id }).then(async ({ _id }) => {
                            
                            return await Friends.bulkWrite([
                                {
                                    "updateOne": {
                                        "filter": { $and: [{ profileId: _id }, { 'friends.user': user._id }] },
                                        "update": { $set: { 'friends.$.conv_id': savedConversation._id } },
                                        "upsert": true,
                                    }
                                },
                                {
                                    "updateOne": {
                                        "filter": { $and: [{ profileId: receipentProfileId }, { 'friends.user': id }] },
                                        "update": { $set: { 'friends.$.conv_id': savedConversation._id } },
                                        "upsert": true
                                    }
                                },

                            ])
                        }).then(async _=>{
                            await MessageMaster.findOneAndUpdate({conversationId: savedConversation._id},{}, {upsert: true, new: true});
                        }).then(_ => {
                            return res.status(200).json({
                                message: `Conversation`,
                                conv_id: savedConversation._id
                            })
                        })
                    })
                }
                catch (err) {
                    const message = ErrorHandler(err)
                    console.log(message, '------')
                    return res.status(500).json(message)
                }
            }
        }

    }
    catch (err) {
        const message = ErrorHandler(err)
        console.log(message)
        return res.status(500).json({
            message: 'Receiver is not valid'
        })

    }



})

// @desc    Get Single Conversation Information of User
// @route   GET /api/conversation/:userId

router.get("/:senderId", auth.verifyToken, async (req, res) => {
    try {
        const conversation = await Conversation.find({
            members: { $in: [req.params.senderId] }
        })
        const msgConversation = await Promise.all(conversation.map(async (conv) => {
            const messages = await MessageMaster.find({
                conversationId: { $in: [conv._id] }
            }).sort({ createdAt: -1 })

            return {
                ...conv._doc,
                messages
            }
        }))
        console.log(msgConversation)

        res.status(200).json(msgConversation)
    }
    catch (err) {
        const message = ErrorHandler(err)
        console.log(message)
        return res.status(500).json({
            message: 'Something went wrong'
        })
    }
})

const getUnseenMessagesCount = async (convId, senderId) => {
    console.log(convId, senderId)
    const data = await MessageMaster.find({
        conversationId: { $in: [convId] },
        sender: { $ne: senderId },
        seen: false
    })
    return data.length
}

router.get("/", auth.verifyToken, async (req, res) => {
    try {
        const conversations = await Conversation.find({
            members: { $in: [req?.user.id] }
        })

        const convWithUnseenMsgs = await Promise.all(conversations.map(async (conv) => {
            return {
                ...conv._doc,
                unseenMessages: await getUnseenMessagesCount(conv._id, req?.user.id)
            }

        }))


        res.status(200).json({
            message: 'All Conversations',
            data: convWithUnseenMsgs
        })
    }
    catch (err) {
        const message = ErrorHandler(err)
        console.log(message)
        return res.status(500).json(message)
    }
})

module.exports = router