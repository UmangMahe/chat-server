const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const ProfileSchema = new mongoose.Schema({

    userId: {
        type: Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
        index: { unique: true }
    },
    gender: {
        type: String,
        default: '',
        enum: ['male', 'female', 'others']
    },
    date_of_birth: {
        type: Date,
        trim: true,
        default: null
    },
    // images: [{
    //     type: Schema.Types.ObjectId,
    //     ref: 'Uploads',
    //     default: []
    // }],
    // address: {
    //     type: String,
    //     default: ''
    // },
    // city: {
    //     type: String,
    //     required: true,
    // },
    // pincode: {
    //     type: Number,
    //     default: null
    // },
    aboutMe: {
        type: String,
        default: ''
    },

}, {
    versionKey: false,
    timestamps: true,
})

module.exports = mongoose.model('Profiles', ProfileSchema);