const express = require('express');
const router = express.Router()
const auth = require('../../../../middleware/auth');
const Users = require('../../../../models/Users');
const Profiles = require('../../../../models/Profiles');
const ErrorHandler = require('../../../../errors/ErrorHandler');
const Friends = require('../../../../models/Friends');

// @desc    Add Friends to Chat
// @route   POST /friends/add-friend

router.post("/add-friend", [auth.verifyToken, auth.checkPhoneNumber, auth.checkProfile], async (req, res) => {

    const { phone, name } = req.fields;
    try {
        const user = await Users.findOne({ phone });
        if (!user) {
            return res.status(200).json({
                message: "The person doesn't exists on Chat. Send an Invite link to join Chat",
                inviteLink: 'https://www.google.com'
            })
        }
        const { _id } = user.toObject();

        const { _id: receipentProfileId } = await Profiles.findOne({ userId: _id });
        const { _id: userId, phone: userPhone } = await Users.findById(req.user.id);
        await Profiles.findOne({ userId: req.user.id }).then(async profile => {
            if (profile) {
                await Friends.bulkWrite([
                    {
                        "updateOne": {
                            "filter": { $and: [{ profileId: profile._id }, { 'friends.user': { $ne: _id } }] },
                            "update": { $addToSet: { friends: { user: _id, customName: name, phone } } },

                        }
                    },
                    {
                        "updateOne": {
                            "filter": { $and: [{ profileId: receipentProfileId }, { 'friends.user': { $ne: userId } }] },
                            "update": { $addToSet: { friends: { user: userId, phone: userPhone } } },
                        }
                    }
                ]).then(_ => {
                    if (_.modifiedCount)
                        return res.status(200).json({
                            message: "Added to friends list"
                        })
                    else return res.status(200).json({
                        message: "Already added to friends list"
                    })

                })
                // await Friends.findOneAndUpdate({ $and: [{ profileId: profile._id }, { 'friends.user': { $ne: _id } }] }, { $addToSet: { friends: { user: _id, customName: name, phone } } }, { new: true }).then(_ => {
                //     if (_)
                //         return res.status(200).json({
                //             message: "Added to friends list"
                //         })
                //     else return res.status(200).json({
                //         message: "Already added to friends list"
                //     })
                // })
            }
        })
    }
    catch (err) {
        const message = ErrorHandler(err)
        return res.status(400).send(message)

    }

})

// @desc    Save as Friend to Chat
// @route   PATCH /friends/update-friend?id=

router.patch("/update-friend", [auth.verifyToken, auth.checkProfile], async (req, res) => {

    const { name } = req.fields;
    const { id } = req.query;
    try {
        const { _id: profileId } = await Profiles.findOne({ userId: req.user.id });
        await Friends.findOneAndUpdate({ profileId, 'friends._id': id }, { $set: { 'friends.$.customName': name } }, { new: true }).then(updated => {
            if(updated){
                return res.status(200).json({
                    message: 'Saved as Friend'
                })
            }
        })
    }
    catch (err) {
        const message = ErrorHandler(err)
        return res.status(400).send(message)

    }

})




// @desc    Get Friends List
// @route   GET /friends

router.get("/", [auth.verifyToken, auth.checkProfile], async (req, res) => {

    const { id } = req.user;
    try {
        await Profiles.findOne({ userId: id }).then(async profile => {
            await Friends.findOne({ profileId: profile._id }).populate({
                path: 'friends.user',
                model: 'Users',
                select: { name: 1, avatar: 1 },
            }).then(list => {
                const { friends } = list.toObject();
                return res.status(200).json({
                    message: 'Friends list',
                    data: friends
                })
            })
        })
    }
    catch (err) {
        const message = ErrorHandler(err)
        return res.status(400).send(message)

    }

})


module.exports = router;