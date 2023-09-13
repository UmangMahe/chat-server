const express = require('express');
const router = express.Router();
const auth = require('../../../../../middleware/auth');
const Users = require('../../../../../models/Users');
const AuthHandler = require('../../../../../utils/auth');
const ErrorHandler = require('../../../../../errors/ErrorHandler');

router.post('/', auth.verifyOtp, async (req, res) => {
    const {userId} = res.locals
    try {
        const user = await Users.findById(userId)
        if (user) {
            await AuthHandler.loginHandler(req, res, user)
        }
        else{
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


module.exports = router;