const nodemailer = require('nodemailer');
const uuidV1 = require('uuid/v1');
var dateFormat = require('dateformat');

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

const kyleEmailAddress = 'kyle@carswaddle.com';
const fromEmailAddress = 'Kyle <' + kyleEmailAddress + '>';
const host = 'car-swaddle.herokuapp.com';


class Emailer {

    constructor(models) {
        this.models = models;
    }

    sendMail(mailOptions) {
        return transporter.sendMail(mailOptions);
    }

    sendUserOilChangeReminderMail(autoService, callback) {
        const mailOptions = this.reminderUserEmailOptions(autoService);
        return this.sendMail(mailOptions).then(info => {
            console.log(info);
            if (!callback) {
                return;
            }
            callback(null);
        }).catch(err => {
            console.log(err);
            if (!callback) {
                return;
            }
            callback(err);
        });
    }

    sendEmailVerificationEmail(user, callback) {
        var date = new Date();
        var self = this;
        return this.models.Verification.create({
            id: uuidV1(),
            resourceID: user.id,
            resourceType: 'user',
            creationDate: date,
        }).then(verification => {
            const link = "https://" + host + "/email/verify?id=" + verification.id;
            const mailOptions = self.verificationEmailOptions(user, link);
            return self.sendMail(mailOptions).then(info => {
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
        const subject = 'Car Swaddle Email Verification';
        const text = 'Hello from Car Swaddle! Please click on this link to verify your email. ' + link;
        const html = 'Hello from Car Swaddle!<br>Please Click on this link to verify your email.<br><a href=' + link + '>' + link + '</a>';
        return this.emailOptions(user.email, subject, text, html);
    }

    reminderUserEmailOptions(autoService) {
        const user = autoService.user;
        const subject = "Car Swaddle Upcoming Oil Change";
        const dateString = dateFormat(autoService.scheduledDate, "dddd, mmmm dS, h:MM TT Z");
        const text = user.firstName + ', you have a Car Swaddle oil change coming up:\n' + dateString;
        const html = user.firstName + ', you have a Car Swaddle oil change coming up:\n' + dateString;
        return this.emailOptions(user.email, subject, text, html);
    }

    emailOptions(email, subject, text, html) {
        return {
            from: fromEmailAddress, // sender address (who sends the email)
            to: email, // list of receivers (who gets the email)
            subject: subject,
            text: text,
            html: html
        };
    }

}

module.exports = Emailer;
