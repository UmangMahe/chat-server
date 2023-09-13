const express = require('express');
const router = express.Router();
// const auth = require('../../../../middleware/auth')
// const Users = require('../../../../models/Users');
// const ErrorHandler = require('../../../../errors/ErrorHandler');
// const CV = require('../../../../models/CV');
// const Profiles = require('../../../../models/Profiles');
const upload = require('../../../../../middleware/upload');
const Users = require('../../../../../models/Users');
const Profiles = require('../../../../../models/Profiles');
const Uploads = require('../../../../../models/Uploads');
const ErrorHandler = require('../../../../../errors/ErrorHandler');
const CV = require('../../../../../models/CV');
const { HeadObjectCommand } = require('@aws-sdk/client-s3');
// const Uploads = require('../../../../models/Uploads');
// const { __basedir } = require('../../../../server');
// const path = require('path')
// const fs = require('fs');

//  @desc       Upload CV
//  @router     PUT /api/v3/upload/cv

router.put('/cv', upload.AWSCvUpload, async (req, res) => {

    const { id } = req.user;

    if (req.file.size === 0 || !req.file || Object.keys(req.file).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }
    try {

        const user = await Users.findById(id);
        if (user) {
            const profile = await Profiles.findOne({ userId: user._id })
            if (profile) {
                const { key, contentType, size } = req.file;
                const fileName = key.split('/')[1]
                const { _id } = profile;
                await CV.findOneAndUpdate({ profileId: _id }, { name: fileName, type: contentType, size }, { upsert: true, new: true }).then(cv => {
                    const { profileId, createdAt, updatedAt, ...rest } = cv.toObject();
                    return res.status(200).json({
                        message: `CV uploaded successfully for ${user.name}`,
                        file: {
                            ...rest,
                            createdAt,
                            updatedAt
                        }
                    })
                }).catch(err => {
                    const message = ErrorHandler(err)
                    return res.status(400).json({
                        message
                    })
                })
                return;
            }
        }
        return res.status(404).json({
            message: "User doesn't exists"
        })
    }
    catch (err) {
        const message = ErrorHandler(err);
        return res.status(401).json({
            message
        })
    }
})

//  @desc       Upload Image/Images
//  @router     PUT /api/v3/upload/images

router.post('/images', upload.AWSImageUpload, async (req, res) => {

    const { id } = req.user;
    if (req.files.size === 0 || !req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }
    try {

        const user = await Users.findById(id);
        if (user) {
            const profile = await Profiles.findOne({ userId: user._id })
            if (profile) {
                const { files } = req
                await Promise.all(files.map(async item => {
                    const { key, contentType, size } = item;
                    const fileName = key.split('/')[1]
                    return await Uploads.create({ uploaded_by: user._id, name: fileName, type: contentType, size })
                })).then(uploaded => {
                    const filterData = uploaded.map(item => {
                        const { _id, ...rest } = item.toObject();
                        return {
                            _id,
                            ...rest
                        }
                    })
                    return res.status(200).json({
                        message: `${filterData.length === 1 ? 'Image' : 'Images'} uploaded successfully for ${user.name}`,
                        data: filterData
                    })
                })

                return;
            }
        }
        return res.status(404).json({
            message: "User doesn't exists"
        })
    }
    catch (err) {
        const message = ErrorHandler(err);
        return res.status(401).json({
            message
        })
    }
})

//  @desc       Get Uploads List
//  @router     GET /api/v3/upload/s3/view

router.get('/view', async (req, res) => {
    const { id } = req.user;

    try {
        const user = await Users.findById(id);
        if (user._id) {
            await Uploads.find({ uploaded_by: user._id }).then(async uploaded => {
                
                const info = await Promise.all(uploaded.map(async item => {
                    const { name } = item;

                    const s3 = await global.s3

                    const command = new HeadObjectCommand({
                        Bucket: process.env.AWS_BUCKET_NAME,
                        Key: `images/${name}`
                    })

                    try {
                        const rp = await s3.send(command)
                        if(rp) return item
                        return null
                    }
                    catch (_) {
                        return null;
                    }

                }))

                return res.status(200).json({
                    message: `Uploads list for ${user.name}`,
                    data: info.filter(a=>a)
                })
            })
        }
    }
    catch (err) {
        const message = ErrorHandler(err);
        return res.status(401).json({
            message
        })
    }
})


module.exports = router;