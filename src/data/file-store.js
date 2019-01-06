const aws = require('aws-sdk');
const uuidV1 = require('uuid/v1');
const fs = require('fs');
const path = require('path')

const accessKeyID = 'AKIAJE4T6M2KIBNLNKRA'
const secretAccessKey = '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';
const bucketName = 'car-swaddle';

const s3 = new aws.S3({ accessKeyId: accessKeyID, secretAccessKey: secretAccessKey });
const keyDirectory = "profile";

module.exports = {
    uploadImage: function (image, previousFileName) {
        const name = previousFileName || uuidV1();
        const params = {
            Bucket: bucketName,
            Key: keyDirectory + '/' + name,
            Body: image,
        };
        return s3.putObject(params).promise().then(data => {
            if (data != null) {
                return name;
            } else { 
                return null;
            }
        });
    },
    getImage: function (name) {
        const params = {
            Bucket: bucketName,
            Key: keyDirectory + '/' + name,
        };
        return s3.getObject(params).promise().then(data => {
            if (data != null) {
                return data;
            } else { 
                return null;
            }
        });
    }
};





