const jwt = require("jsonwebtoken");
const Users = require("../models/Users");
const ErrorHandler = require("../errors/ErrorHandler");
const moment = require('moment');
const { OTP_DELAY } = require("../config/otp");
const Otps = require("../models/Otps");
const CountryCodes = require('country-calling-code');
const Profiles = require("../models/Profiles");
const Friends = require("../models/Friends");


const verifyToken = (req, res, next) => {
    const bearerHeader = req.headers["authorization"];
    const token = bearerHeader && bearerHeader.split(" ")[1];

    if (!token) return res.status(401).send("Access denied. No token provided.");

    try {
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) return res.status(403).send("Access denied. Invalid token.");
            req.user = user;
            console.log("Authenticated")
        })


    }
    catch (err) {
        return res.status(401).send("Access denied. Invalid token.");
    }
    return next();

}

const otpBoiler = async (req, res, cb, cb2) => {
    const { phone } = req.fields;
    if (!phone) return res.status(401).send({ error: "Phone number required" });

    try {
        const user = await Users.findOne({ phone }).populate('otp');
        if (user) {
            const { otp: otpData } = user;

            if (otpData) {
                cb(otpData, user);
            }
            else {
                cb2();
            }
            return;
        }
        return res.status(409).send({
            message: "Invalid Credentials"
        })
    }
    catch (err) {
        const message = ErrorHandler(err)
        return res.status(400).send(message)
    }
}

const verifyOtp = async (req, res, next) => {

    await otpBoiler(req, res, async function (otpData, user) {
        const { updatedAt, expiresIn } = otpData
        const isOtpExpired = moment(updatedAt).add(expiresIn, 'milliseconds').isBefore(moment());
        if (isOtpExpired) {
            return res.status(400).json({
                message: 'Otp expired, please initiate new otp request'
            })
        }
        try {
            const { otp, userId } = otpData;
            if (req.fields.otp === otp && userId.toString() === user._id.toString()) {
                console.log('Otp verified');
                res.locals.userId = userId
                await Otps.findByIdAndRemove(otpData._id).then(async _ => {
                    await Users.findByIdAndUpdate(userId, {otp: null}).then(_=>{return next();})
                })

            }
            else {
                return res.status(400).json({
                    message: 'Invalid Otp Provided'
                });
            }
        }
        catch (err) {
            const message = ErrorHandler(err)
            return res.status(400).send(message)
        }
    }, function () {
        return res.status(400).json({
            message: 'Invalid Otp Provided'
        });
    })
}

const checkOtp = async (req, res, next) => {
    await otpBoiler(req, res, function (otpData, _) {
        const { updatedAt } = otpData;
        const duration = moment.duration(moment().diff(moment(updatedAt)));

        if (duration.asSeconds() > OTP_DELAY)
            return next();
        else return res.status(400).json({
            message: `Please wait for ${OTP_DELAY}s to initiate OTP`
        })
    }, function () {
        return next();
    })

}

const checkPhoneNumber = async (req, res, next) => {

    const { phone } = req.fields;
    if (!phone) return res.status(400).send({ error: "Phone number is required" })

    const code = phone.substring(0, phone.length - 10)
    if (code) {
        const { codes } = CountryCodes;
        const country = codes.some((item) => {
            return item.countryCodes.includes(code)
        })
        if (!country || phone.substring(phone.length - 10).length !== 10) {
            return res.status(400).send({
                message: `Invalid phone number - ${phone} provided`
            })
        }
        else {
            return next();
        }
    }
    else return res.status(400).send({
        message: `Invalid phone number - ${phone} provided`
    })

}

const checkProfile = async (req, res, next) => {

    const { id } = req.user;

    try {
        const user = await Users.findById(id);
        if (user) {
            const profile = await Profiles.findOne({ userId: user._id })
            if (profile) {
                await Friends.findOneAndUpdate({ profileId: profile._id }, {}, { upsert: true }).then(_ => {
                    return next();
                })
                return;
            }
            else return res.status(200).json({
                message: "Oops! We encountered some error",
            })
        }
        return res.status(400).json({
            message: "User details not found"
        })
    }
    catch (err) {
        const message = ErrorHandler(err)
        return res.status(400).send(message)
    }

}

// const checkFriends = async (req, res, next) => {

//     const {_id} = req.fields;
//     if(!_id) return res.status(400).json({ message: 'Id is required' });

//     try {
//         const user = await Users.findById(id);
//         if (user) {
//             const profile = await Profiles.findOne({ userId: id })
//             if (profile) {
//                 return next();
//             }
//             return res.status(200).json({
//                 message: "Oops! We encountered some error",
//             })
//         }
//         return res.status(400).json({
//             message: "User details not found"
//         })
//     }
//     catch (err) {
//         const message = ErrorHandler(err)
//         return res.status(400).send(message)
//     }

// }



module.exports = {
    verifyToken,
    verifyOtp,
    checkOtp,
    checkPhoneNumber,
    checkProfile
}