const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
        index: {
            unique: true
        }
    },

    otp: {
        type: String,
        required: true
    },

    expiresIn: {
        type: String,
        default: '300000',
    }
}, {
    versionKey: false,
    timestamps: true
})

module.exports = mongoose.model('Otps', OtpSchema);