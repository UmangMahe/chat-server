const ErrorHandler = require('../../../../errors/ErrorHandler');
const Message = require('../../../../models/Messages');
const Conversation = require('../../../../models/Conversation');
const Users = require('../../../../models/Users');

const auth = require('../../../../middleware/auth');
const MessageMaster = require('../../../../models/MessageMaster');
const router = require('express').Router();


// @desc    Add Message to Conversation
// @route   POST /api/message

router.put('/', auth.verifyToken, async (req, res) => {

    const { conv_id, message, type } = req.fields

    const conversation = await Conversation.findById(conv_id)

    if (conversation && conversation.members.includes(req.user.id)) {
        try {
            const msg = new Message({
                sender: req.user.id,
                message,
                type,
            })
            const savedMessage = await msg.save();
            await MessageMaster.findOneAndUpdate({ conversationId: conv_id }, { $addToSet: { messages: savedMessage._id } }, { upsert: true, new: true, setDefaultsOnInsert: true }).then(async item => {
                const { _id, ...rest } = savedMessage.toObject();
                const { conversationId } = item;
                return res.status(200).json({
                    message: 'Message saved',
                    data: {
                        _id,
                        conversationId,
                        ...rest
                    }
                })
            })
        }
        catch (err) {
            const message = ErrorHandler(err)
            console.log(message)
            return res.status(500).json(message)
        }
    }
    if (!conversation) {
        return res.status(400).json({
            message: 'Conversation does not exist'
        })

    }

})

// @desc   Set Message to Seen
// @route  PATCH /api/message/:msgId

router.patch('/:msgId', auth.verifyToken, async (req, res) => {
    try {

        const message = await Message.findOneAndUpdate({ _id: req.params.msgId }, { '$set': { seen: true } }, { new: true })
        if (message) {
            return res.status(200).json({
                message: 'Message seen',
                data: message
            })
        }

    }
    catch (err) {
        const message = ErrorHandler(err)
        console.log(message)
        return res.status(500).json(message)
    }

})

// @desc    Get Messages from a Conversation
// @route   GET /api/v1/message/:id

router.get("/:id", auth.verifyToken, async (req, res) => {
    const { id, last } = req.params;

    if (!id) return res.status(400).json({ message: 'Id is required' });
    try {
        const conversation = await Conversation.findOne({ _id: id, members: { $in: [req.user.id] } })

        if (conversation) {
            await MessageMaster.findOne({ conversationId: conversation._id }).populate({
                path: 'messages',
                limit: 50,
                options: { sort: { createdAt: -1 } }
            }).then(item => {
                const { messages } = item;
                return messages.map(item => {
                    if (item.sender.toString() !== req.user.id) {
                        item['seen'] = true
                        item.save();
                    }
                    return item;
                }).sort((a,b)=>a.createdAt - b.createdAt)
            }).then(async messages => {
                return res.status(200).json({
                    messages,
                    conversation,
                })
            })
            // await Message.updateMany({ conversationId: id, sender: { $ne: req.user.id } }, { "$set": { 'seen': true } }).then(async _ => {
            //     const messages = await Message.find({
            //         conversationId: id
            //     }, {})


            //     // const member1 = await Users.findById(conversation.members[0])

            //     // const member2 = await Users.findById(conversation.members[1])

            //     return res.status(200).json({
            //         messages: messages,
            //         // conversation: conversation,
            //         // members: [
            //         //     member1,
            //         //     member2
            //         // ]
            //     })
            // })
        }
        else {
            return res.status(400).json({
                message: 'Conversation does not exist'
            })
        }

    }
    catch (err) {
        const message = ErrorHandler(err)
        console.log(message)
        return res.status(500).json(message)
    }
})

// @desc   Get All Unseen Messages Count
// @route  GET /api/message/unseen/:userId


module.exports = router