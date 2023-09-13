const mongoose = require('mongoose');
const cron = require('node-cron');
const Sessions = require('../../models/Sessions');
const Users = require('../../models/Users');

// @desc        Cron job to remove expired sessions and tokens
// @param       {Object}   cronJob  Cron job object
// @interval    Every 1 minute(s)

let SessionRemoveCron = cron.schedule('* * * * *', async () => {
    console.log("Current time: ", new Date().toLocaleTimeString());
    console.log("Finding Expired Sessions and Tokens...");
    try {
        await Sessions.deleteMany({ $or: [{ expires: { $lte: Date.now() / 1000 } }, { logoutSession: true }] }).then(async () => {
            await Users.find({}).then(users => {
                users.forEach(user => {
                    user.session.forEach(sessionId => {
                        try {
                            Sessions.countDocuments({ _id: sessionId }).then(async count => {
                                count === 0 && (
                                    await Users.findOneAndUpdate({ _id: user._id }, {
                                        $pull: { session: sessionId }
                                    }, { new: true }).then(() => {
                                        console.log("\nRemoved expired sessions successfully (Cron job completed)\n")
                                    })
                                )
                            })
                        }
                        catch (err) {
                            console.log(err);
                        }
                    })
                })
            })
        })
    }
    catch (err) {
        console.log(err);
    }
})

module.exports = SessionRemoveCron