const jwt = require('jsonwebtoken');
const Users = require('../models/Users');
const Sessions = require('../models/Sessions');
const ErrorHandler = require('../errors/ErrorHandler');
const JWT_CONFIG = require('../config/jwt')

const loginHandler = async (req, res, user) => {
    const {_id, name, email} = user;
    const token = jwt.sign({ id: _id, sessionId: req.sessionID, email, name },
        process.env.JWT_SECRET, {
        expiresIn: JWT_CONFIG.JWT_EXPIRE
    })

    const { id, exp } = jwt.decode(token);

    await Sessions.findOneAndUpdate({ $and: [{ sessionID: req.sessionID }, { userID: id }] }, {
        expires: exp,
        logoutSession: false,
    }, { upsert: true, new: true }).then(session => {
        return Users.findOneAndUpdate({ _id: id }, { $addToSet: { session: session._id } }, { new: true })
    }).then(user => {
        user.populate({
            path: 'session',
            match: { sessionID: req.sessionID }
        }).then(user => {
            const { password, otp, ...userInfo } = user.toObject()
            return res.status(200).json({
                message: "User logged in successfully",
                user: userInfo,
                access_token: token
            })
        })
    }).catch(err => {
        const message = ErrorHandler(err)
        return res.status(400).json({
            message
        })
    })
    return;
}

module.exports = {
    loginHandler
}