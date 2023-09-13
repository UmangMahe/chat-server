const express = require('express');
const router = express.Router();
const auth = require('../../../../middleware/auth');
const Users = require('../../../../models/Users');
const ErrorHandler = require('../../../../errors/ErrorHandler');
const Profiles = require('../../../../models/Profiles');
const { getAuthTokenFromHeader } = require('../../../../utils');
const moment = require('moment');
const { defaultDateFormat } = require('../../../../constants');
const Friends = require('../../../../models/Friends');

const profileHandler = async (res, userInfo, profile, update = false) => {
    const { name, email, phone, avatar } = userInfo.toObject();

    const { _id, userId, updatedAt, ...rest } = profile.toObject()
    return res.status(200).json({
        message: `Profile ${update ? 'Updated' : 'Details'} for ${name}`,
        profile: {
            _id,
            userId,
            name,
            email,
            phone,
            avatar,
            ...rest,
            updatedAt
        }
    })
}

// @desc    User Profile
// @route   GET /api/profile/user-profile

router.get('/user-profile', auth.verifyToken, async (req, res) => {

    try {
        await Users.findById(req.user.id).then(user => {
            if (user) {
                user.populate({
                    path: 'avatar',
                    model: 'Uploads',
                    select: { name: 1, type: 1 }
                }).then(async user => {
                    await Profiles.findOneAndUpdate({ userId: user._id }, {}, { upsert: true, new: true }).then(async profile => {
                        await Friends.findOneAndUpdate({ profileId: profile._id }, {}, { upsert: true, new: true, setDefaultsOnInsert: true }).then(async _=>{
                            await profileHandler(res, user, profile)
                        })
                    }).catch(err => {
                        const message = ErrorHandler(err)
                        return res.status(400).json({
                            message
                        })
                    })
                })

                return;
            }
            return res.status(404).json({
                message: "User doesn't exists"
            })
        })
    }
    catch (err) {
        const message = ErrorHandler(err);
        return res.status(401).json({
            message
        })
    }

})


// @desc    Set User Profile by Token
// @route   PUT /api/profile/user-profile

router.put('/user-profile', auth.verifyToken, async (req, res) => {

    const { id } = req.user

    try {
        const user = await Users.findById(id);
        if (user) {
            const { name, email, phone, avatar, ...profileInfo } = req.fields;
            if (name) user.name = name;
            if (email) user.email = email;
            if (phone) user.phone = phone;
            if (avatar) user.avatar = avatar;
            const userInfo = await user.save();

            if (profileInfo['date_of_birth'])
                profileInfo['date_of_birth'] = moment(profileInfo['date_of_birth'], defaultDateFormat);

            userInfo.populate({
                path: 'avatar',
                model: 'Uploads',
                select: { name: 1, type: 1 }
            }).then(async user => {
                await Profiles.findOneAndUpdate({ userId: id }, { ...profileInfo }, { new: true, upsert: true }).then(async profile => {
                    await profileHandler(res, user, profile, true)
                }).catch(err => {
                    const message = ErrorHandler(err)
                    return res.status(400).json({
                        message
                    })
                })
            })
            return;
        }
        else {
            return res.status(404).json({
                message: "User doesn't exists"
            })
        }

    }
    catch (err) {
        const message = ErrorHandler(err);
        return res.status(401).json({
            message
        })
    }
})

module.exports = {
    router,
    profileHandler
};