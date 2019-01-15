const nodemailer = require('nodemailer');
const uuidV1 = require('uuid/v1');

// Create the transporter with the required configuration for Outlook
// change the user and pass !
var transporter = nodemailer.createTransport({
    host: "smtp-mail.outlook.com", // hostname
    secureConnection: false, // TLS requires secureConnection to be false
    port: 587, // port for secure SMTP
    tls: {
        ciphers: 'SSLv3'
    },
    auth: {
        user: 'kyle@carswaddle.com',
        pass: 'carswaddleftw1"'
    }
});

const sendFromEmailAddress = 'kyle@carswaddle.com';
const host = 'car-swaddle.herokuapp.com';


class Emailer {

    constructor(models) {
        this.models = models;
    }

    sendMail(mailOptions) {
        return transporter.sendMail(mailOptions);
    }

    sendEmailVerificationEmail(user, callback) {
        var date = new Date();
        return this.models.Verification.create({
            id: uuidV1(),
            resourceID: user.id,
            resourceType: 'user',
            creationDate: date,
        }).then(verification => {
            const link = "https://" + host + "/email/verify?id=" + verification.id;
            const mailOptions = this.verificationEmailOptions(user, link);
            return this.sendMail(mailOptions).then(info => {
                console.log(info);
                callback(null);
            }).catch(err => {
                console.log(err);
                callback(err);
            });
        }).catch(err => {
            console.log(err);
            callback(err);
        });
    }

    verificationEmailOptions(user, link) {
        return {
            from: 'Kyle <' + sendFromEmailAddress + '>', // sender address (who sends)
            to: user.email, // list of receivers (who receives)
            subject: 'Please verify',
            text: 'Hello, please Click on this link to verify your email. ' + link,
            html: 'Hello,<br> Please Click on this link to verify your email.<br><a href=' + link + '>' + link + '</a>'
        };
    }

}

module.exports = Emailer;
