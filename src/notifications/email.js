const postmark = require("postmark");
const uuidV1 = require('uuid/v1');
const dateFormat = require('dateformat');
const { DateTime } = require('luxon');
const constants = require('../controllers/constants.js');

const client = new postmark.ServerClient("c6de928c-7a71-4ba7-a950-19acaad60c46");

const fromEmailAddress = 'Kyle <kyle@carswaddle.com>';

const authorityApproverEmail = 'kyle@carswaddle.com';

const domain = 'https://' + constants.CURRENT_DOMAIN;

const acceptURL = domain + '/authority/approve';
const rejectURL = domain + '/authority/reject';
const unsubscribeURL = domain + '/email-unsubscribe';

const allowEmail = true;

class Emailer {

    constructor(models) {
        this.models = models;
    }

    sendMail(mailOptions) {
        if (!allowEmail) {
            return;
        }

        if(mailOptions.TemplateId) {
            return client.sendEmailWithTemplate(mailOptions);
        } else {
            return client.sendEmail(mailOptions);
        }
    }

    sendAdminEmail(subject, contents) {
        const options = this.emailOptions(fromEmailAddress, subject, contents);

        return this.sendMail(options);
    }

    sendUserOilChangeReminderMail(autoService, callback) {
        if (!allowEmail) {
            if (callback) {
                callback('no emails allowed');
            }
            return;
        }
        const self = this;
        this.emailsAllowed(autoService.user, function (emailsAllowed) {
            if (!emailsAllowed) {
                if (callback) {
                    callback(null);
                }
                return;
            }
            self.reminderUserEmailOptions(autoService, function (err, mailOptions) {
                self.sendMail(mailOptions).then(info => {
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
            });
        });
    }

    sendNPSSurvey(userFirstName, userEmail) {
        return client.sendEmailWithTemplate({
            From: fromEmailAddress,
            To: userEmail,
            TemplateId: 13011158,
            TemplateModel: {
                first_name: userFirstName,
            },
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
            const link = domain + "/email/verify?id=" + verification.id;
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

    sendAuthorityRequestEmailToAdmin(user, authorityRequest, callback) {
        const emailOptions = this.authorityRequestEmailOptions(user, authorityRequest);
        return this.sendMail(emailOptions).then(info => {
            console.log(info);
            callback(null);
        }).catch(err => {
            console.log(err);
            callback(err);
        });
    }

    authorityRequestEmailOptions(user, authorityRequest) {
        const subject = 'Car Swaddle Authority Request';
        const acceptURL = this.authorityAcceptURL(user, authorityRequest);
        const rejectURL = this.authorityRejectURL(user, authorityRequest);
        var text = user.displayName + ' requested the authority:\n' + authorityRequest.authorityName;
        text += '\n\nAccept: ' + acceptURL;
        text += '\n\nReject: ' + rejectURL;
        
        var html = user.displayName() + ' requested the authority:<br>' + authorityRequest.authorityName + ' <br><br><a href=' + acceptURL + '>Approve</a>' + '<br><br><a href=' + rejectURL + '>Reject</a>';
        return this.emailOptions(authorityApproverEmail, subject, text, html);
    }
 
    authorityAcceptURL(user, authorityRequest) {
        return acceptURL + '?email=' + encodeURIComponent(user.email) + '&secretID=' + authorityRequest.secretID;
    }

    authorityRejectURL(user, authorityRequest) {
        return rejectURL + '?email=' + encodeURIComponent(user.email) + '&secretID=' + authorityRequest.secretID;
    }

    verificationEmailOptions(user, link) {
        const subject = 'Car Swaddle Email Verification';
        const text = 'Hello from Car Swaddle! Please click on this link to verify your email. ' + link + '\n\n';
        const html = 'Hello from Car Swaddle!<br>Please Click on this link to verify your email.<br><a href=' + link + '>' + link + '</a>';
        return this.emailOptions(user.email, subject, text, html);
    }

    reminderUserEmailOptions(autoService, callback) {
        const self = this;
        autoService.getUser().then(user => {
            const subject = "Car Swaddle Upcoming Oil Change";
            const dateTime = DateTime.fromJSDate(autoService.scheduledDate, { setZone: true, zone: user.timeZone || 'America/Denver' });
            const dateString = dateTime.toFormat("cccc LLLL d, h:mm ZZZZ");
            console.log(dateString);
            var text = user.firstName + ', you have a Car Swaddle oil change coming up:\n' + dateString;
            var html = user.firstName + ', you have a Car Swaddle oil change coming up:\n' + dateString;

            const self = this;
            self.fetchSubscriptionSettings(user.id).then(subscriptionSettings => {
                const unsubscribeID = subscriptionSettings[0].unsubscribeID;
                if (unsubscribeID) {
                    text += '\n\n' + self.unsubscribeLink(unsubscribeID);
                    html += '<br><br>' + self.unsubscribeHRef(unsubscribeID);
                }

                const options = self.emailOptions(user.email, subject, text, html);
                callback(null, options);
            }).catch(err => {
                callback(err, null);
            });
        }).catch(err => {
            callback(err, null);
        })
    }

    unsubscribeHRef(unsubscribeID) {
        return '<a href=' + this.unsubscribeLink(unsubscribeID) + ' style="color: rgb(66,66,66)" size="-1">' + 'unsubscribe' + '</a>';
    }

    unsubscribeLink(unsubscribeID) {
        return unsubscribeURL + '?unsubscribeID=' + unsubscribeID
    }

    fetchSubscriptionSettings(userID) {
        return this.models.SubscriptionSettings.findOrCreate({
            where: { userID: userID },
            defaults: { id: uuidV1(), userID: userID, sendReminderEmails: true, unsubscribeID: uuidV1() }
        });
    }

    emailsAllowed(userID, callback) {
        this.models.SubscriptionSettings.findOrCreate({
            where: { userID: userID },
            defaults: { id: uuidV1(), userID: userID, sendReminderEmails: true, unsubscribeID: uuidV1() }
        }).then(subscriptionSettings => {
            callback(subscriptionSettings.sendReminderEmails);
        }).catch(err => {
            callback(false);
        });
    }

    emailOptions(email, subject, text, html) {
        return {
            From: fromEmailAddress, // sender address (who sends the email)
            To: email, // list of receivers (who gets the email)
            TemplateId: 13034656,
            TemplateModel: {
                subject,
                text: text || html,
                html: html || text,
            },
        };
    }

}

module.exports = Emailer;
