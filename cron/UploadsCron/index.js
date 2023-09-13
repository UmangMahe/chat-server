// const mongoose = require('mongoose');
// const cron = require('node-cron');
// const Sessions = require('../../models/Sessions');
// const Users = require('../../models/Users');
// const Uploads = require('../../models/Uploads');
// const path = require('path');
// const fs = require('fs');
// const { __basedir } = require('../../server.js');
// const Profiles = require('../../models/Profiles');
// const { ListObjectsV2Command, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');


// const getContents = async (s3, bucket, type) => {
//     const command = new ListObjectsV2Command({
//         Bucket: bucket,
//         Prefix: type,
//     });

//     let contents = [];

//     try {
//         let isTruncated = true;


//         while (isTruncated) {
//             const { Contents, IsTruncated, NextContinuationToken } = await s3.send(command);
//             const contentsList = Contents.map((c) => `${c.Key.split('/')[1]}`);
//             contents.push(...contentsList);
//             isTruncated = IsTruncated;
//             command.input.ContinuationToken = NextContinuationToken;
//         }

//         return contents;

//     } catch (err) {
//         // no error
//     }
// }
// const checkObjectExists = async (s3, bucket, key) => {
//     const command = new HeadObjectCommand({
//         Bucket: bucket,
//         Key: key,
//     });

//     try {
//         const rp = await s3.send(command)
//         return rp

//     } catch (err) {
//         // no error
//     }
// }
// const deleteObject = async (s3, bucket, key) => {
//     const command = new DeleteObjectCommand({
//         Bucket: bucket,
//         Key: key,
//     });

//     try {
//         await s3.send(command);
//     } catch (err) {
//         console.error(err);
//     }
// }
// // @desc        Cron job to remove unrelated cv uploads and images
// // @param       {Object}  cronJob  Cron job object
// // @interval    Every midnight

// let UploadsRemoveCron = cron.schedule('0 0 0 * * *', async () => {
//     console.log("Current time: ", new Date().toLocaleTimeString());
//     console.log("This Cron Job runs only on midnights\n");
//     console.log("Finding Unrelated CVs and Images...");
//     try {
//         // const baseDir = path.join(__basedir, "uploads");

//         // // Checking collection - uploads for images
//         // const imagePath = path.join(baseDir, "/images");
//         const fn = (file, type) => {
//             console.log('Deleting Unrelated Image...')
//             const key = `${type}/${file}`
//             deleteObject(global.s3, process.env.AWS_BUCKET_NAME, key)
//         }
//         const userList = await Users.find();
//         userList.forEach(async ({ _id, avatar }) => {
//             if (avatar) {
//                 const image = await Uploads.findById(avatar)
//                 if (!image) {
//                     console.log('Removing unrelated image references from collections...');
//                     await Users.findByIdAndUpdate(_id, { avatar: null })
//                 }
//             }
//         })
//         const profileList = await Profiles.find();
//         profileList.forEach(async ({ _id, images }) => {
//             if (images.length) {
//                 images.forEach(async id => {
//                     const image = await Uploads.findById(id)
//                     if (!image) {
//                         console.log('Removing unrelated image references from collections...');
//                         await Profiles.findByIdAndUpdate(_id, { $pull: { images: id } })
//                     }
//                 })
//             }
//         })

//         const objectList = await getContents(global.s3, process.env.AWS_BUCKET_NAME, "images");

//         if (objectList?.length) {
//             objectList.forEach(async file => {

//                 await Uploads.find({ name: file }).then(async upload => {
//                     if (!upload.length) {
//                         fn(file, "images")
//                     }
//                     else {
//                         const { _id } = upload[0];
//                         const imageinUser = await Users.find({ avatar: _id }).count();
//                         const imageinProfile = await Profiles.find({ images: _id }).count()

//                         if (!imageinUser && !imageinProfile) {
//                             console.log('Deleting unrelated image documents from collection...');
//                             await Uploads.deleteOne({ name: file }).then(deleted => {
//                                 if (deleted.acknowledged)
//                                     fn(file, "images")
//                             })
//                         }
//                     }
//                 })
//             })
//         }


//         const uploadList = await Uploads.find()
//         uploadList.forEach(async ({ name }) => {

//             const key = `images/${name}`
//             const check = await checkObjectExists(global.s3, process.env.AWS_BUCKET_NAME, key)
//             if (!check) {
//                 console.log('Deleting unrelated image documents from collection...');
//                 await Uploads.deleteOne({ name })
//             }
//         })
//     }
//     catch (err) {
//         console.log(err);
//     }
// })

// module.exports = UploadsRemoveCron