const ErrorHandler = require('../../../../errors/ErrorHandler');
const Message = require('../../../../models/MessageMaster');
const auth = require('../../../../middleware/auth');
const Users = require('../../../../models/Users');
const router = require('express').Router();


// @desc    Get User from ID
// @route   GET /api/users

router.get("/", auth.verifyToken, async(req,res)=>{
    const userId = req.query.userId
    const userName = req.query.name
    try{
        const user = userId ? await Users.findById(userId) 
        : await Users.findOne({name: userName})

        if(user){
            const {password, updatedAt, ...other} = user.toObject()
        return res.status(200).json({
            message: 'User details with Id or Name',
            user: other
        })
        }
        else{
            return res.status(400).json({
                message: "User not found"
            })
        }
        
    }
    catch(err){
        const message = ErrorHandler(err)
        console.log(message)
        return res.status(500).json(message)
    }
})


module.exports = router