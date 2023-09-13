const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const FriendsSchema = new mongoose.Schema({

    profileId: {
        type: Schema.Types.ObjectId,
        ref: 'Profiles',
        required: true,
        // index: { unique: true }
    },
    friends: [{
        conv_id: {
            type: Schema.Types.ObjectId,
            ref: 'Conversations',
            default: null
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: 'Users',
            required: true,
        },
        customName: {
            type: String,
            default: ''
        },
        phone: {
            minlength: 10,
            type: Number,
            default: null
        },

    }],

}, {
    versionKey: false,
    timestamps: true,
})

module.exports = mongoose.model('Friends', FriendsSchema);