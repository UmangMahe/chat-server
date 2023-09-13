const express = require('express');
const auth = require('../../../middleware/auth');
const router = express.Router()


// @desc    Server API Page
// @route   GET /api/v1


router.get("/", (req, res) => {

    res.send(`Welcome to the server, you are at the Server API Page`);

})

router.use("/auth", require('./Authentication')) //this is the route for authentication
router.use('/conversation', [auth.verifyToken,auth.checkProfile], require('./Conversations')) //this is the route for conversations
router.use('/message', [auth.verifyToken,auth.checkProfile], require('./Messages')) //this is the route for messages
router.use('/users', auth.verifyToken, require('./Users')) //this is the route for users
router.use('/friends', [auth.verifyToken,auth.checkProfile], require('./Friends'))
router.use("/profile", auth.verifyToken, require('./Profile').router);


module.exports = router