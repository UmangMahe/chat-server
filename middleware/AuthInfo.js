const jwt = require("jsonwebtoken")

const getInfo = (req, res, next) => {
    const bearerHeader = req.headers["authorization"];
    const token = bearerHeader && bearerHeader.split(" ")[1];

    if(!token) return res.status(401).send("Access denied. No token provided.");
    
    try {
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if(err) return res.status(403).send("Access denied. Invalid token.");
            req.user = user;
            console.log("Authenticated")
        })

    
    }
    catch (err) {
        return res.status(401).send("Access denied. Invalid token.");
    }

    return next();

}

module.exports = getInfo