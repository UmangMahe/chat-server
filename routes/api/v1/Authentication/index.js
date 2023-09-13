const express = require('express');
const router = express.Router()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs');
const Users = require('../../../../models/Users');
const ErrorHandler = require('../../../../errors/ErrorHandler');
const { default: axios } = require('axios');
const { request } = require('express');
const OtpHandler = require('../../../../config/otp');
const Otps = require('../../../../models/Otps');
const auth = require('../../../../middleware/auth');
const AuthHandler = require('../../../../utils/auth');
const Sessions = require('../../../../models/Sessions');

// @desc    Server Login Using Phone
// @route   GET /api/v1/auth/login-phone

router.post('/login-phone', auth.checkOtp, async (req, res) => {

    try {
        const { phone } = req.fields;


        const user = await Users.findOne({ phone });
        if (user) {

            const otp = await OtpHandler.getOTP();
            try {
                const otpData = await Otps.findOneAndUpdate({ userId: user._id }, { otp }, { upsert: true, new: true })
                if (otpData) {
                    await Users.findByIdAndUpdate(user._id, { otp: otpData._id }, { new: true }).then(async user => {
                        await OtpHandler.sendOtp(user.phone, otp).then(async _ => {
                            return res.status(200).json({
                                message: "Otp sent to device successfully",
                            })
                        })

                    })
                }
                return;
            }
            catch (_) {
                return res.status(400).json({
                    message: "Error while verifying phone number!"
                })
            }

        }
        return res.status(404).json({
            message: "User not found"
        })
    }
    catch (err) {
        const message = ErrorHandler(err)
        return res.status(400).send(message)
    }
})

router.use('/login-phone/verify', require('./verify')); //Final step to verify otp and provide access token

// @desc    Server API Login Page
// @route   GET /api/login

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.fields
        if (!email) return res.status(400).json({ error: "Email is required" })
        if (!password) return res.status(400).json({ error: "Password is required" })

        const user = await Users.findOne({ email })

        if (user && await bcrypt.compare(password, user.password)) {
            await AuthHandler.loginHandler(req, res, user);
        }
        else {
            return res.status(401).json({
                message: "Invalid Credentials"
            })
        }
    }
    catch (err) {
        const message = ErrorHandler(err)
        return res.status(400).send(message)


    }
})

// @desc    Server API Register Page
// @route   GET /api/auth/register

router.post("/register", auth.checkPhoneNumber, async (req, res) => {

    try {

        const { name, email, phone, avatar, password } = req.fields;

        if (!email) return res.status(400).send({ error: "Email is required" })
        if (!password) return res.status(400).send({ error: "Password is required" })
        if (!name) return res.status(400).send({ error: "Name is required" })

        let oldUser = await Users.findOne({ $or: [{ email }, { phone }] })
        if (oldUser) {
            return res.status(409).send({
                message: "User already exists"
            })

        }
        const hashedPassword = password ? await bcrypt.hash(password, 12) : null

        const registeredUser = await Users.create({
            name,
            email: email.toLowerCase(),
            phone,
            avatar,
            password: hashedPassword
        }).then(user => {
            const { password, otp, ...userInfo } = user.toObject()
            return userInfo
        })

        return res.status(201).json({
            message: "User created successfully",
            user: registeredUser,
        })
    }
    catch (err) {
        const message = ErrorHandler(err)
        return res.status(400).send(message)


    }
})

// @desc    Server API Logout
// @route   GET /api/auth/logout

router.delete("/logout", auth.verifyToken, async (req, res) => {
    try {
        const bearerToken = req.headers.authorization.split(" ")[1];

        const { id, sessionId } = jwt.decode(bearerToken);

        await Sessions.findOneAndUpdate({ $and: [{ userID: id }, { sessionID: sessionId }] }, {
            logoutSession: true
        }, { new: true }).then(session => {
            if (session) {
                return res.status(200).json({
                    message: "User logged out successfully",
                    user: session.user
                })
            }
            return;
        }).catch(err => {
            const message = ErrorHandler(err)
            return res.status(400).json({
                message
            })
        });
    }
    catch (err) {
        const message = ErrorHandler(err)
        console.log(message)
        return res.status(400).send(message)
    }
})

module.exports = router