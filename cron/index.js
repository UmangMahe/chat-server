const connectDB = require("../config/db");
const SessionRemoveCron = require("./SessionCron");
const dotenv = require('dotenv');

const initCron = async () => {
    try {
        // Load config 
        dotenv.config({
            path: './config.env',
        })

        await connectDB(process.env.MONGODB_URI, true);

        SessionRemoveCron.start();
        
    }
    catch (err) {
        console.log(err);
    }
}

initCron();