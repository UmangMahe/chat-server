const { default: mongoose, Schema, mongo } = require("mongoose");

const UploadsSchema = new mongoose.Schema({
    uploaded_by: {
        type: Schema.Types.ObjectId,
        ref: 'Users',
        required: true,
    },
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    }
}, {
    versionKey: false,
    timestamps: true
})

module.exports = mongoose.model('Uploads', UploadsSchema);