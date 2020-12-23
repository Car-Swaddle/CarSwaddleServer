const constants = require('./constants.js');
// const { Op } = require('sequelize');
const uuidV1 = require('uuid/v1');
const stripe = require('stripe')(constants.STRIPE_SECRET_KEY);
const emailFile = require('../notifications/email');

const resetPasswordDomain = 'reset-password';

module.exports = function (models) {
    return new PasswordResetController(models);
};

function PasswordResetController(models) {
    this.models = models;
    this.emailer = new emailFile(models);
    this.init();
}

PasswordResetController.prototype.init = function () {

};

PasswordResetController.prototype.requestResetPassword = async function (email, appName, callback) {
    if (!email) {
        callback('no email', null);
        return;
    }

    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const newToken = uuidV1();

    const self = this;
    var email = email.toLowerCase();

    this.models.User.findOne({
        where: { email: email }
    }).then(user => {
        if (!user) {
            callback(404, null);
            return;
        }
        this.models.PasswordReset.create({
            id: uuidV1(), email: email, token: newToken, expirationDate: tomorrow
        }).then(passwordReset => {
            console.log('created new password reset');
            self.sendForgotPasswordEmail(email, appName, user.firstName, newToken);
            callback(null, passwordReset);
        }).catch(err => {
            callback(err, null);
        });
    }).catch(err => {
        callback(0, null);
    });
}

PasswordResetController.prototype.setNewPassword = async function (token, newPassword, callback) {
    if (!token || !newPassword) {
        callback('must have new password and token', null);
        return;
    }

    const self = this;
    this.models.PasswordReset.findOne({
        where: { token: token },
    }).then(async passwordReset => {
        if (!(new Date() < passwordReset.expirationDate)) {
            return callback('expired reset token', null);
        }
        console.log('Fetch password reset');

        const user = await self.models.User.findOne({
            where: { email: passwordReset.email }
        })
        if (!user) {
            return callback('invalid token', null);
        }
        user.password = self.models.User.generateHash(newPassword);
        const success = await user.save();

        if (success) {
            self.sendResetPasswordEmail(user.email);
            self.models.PasswordReset.destroy({
                where: { id: passwordReset.id }
            }).then(destroyed => {
                callback(null, user);
            }).catch(err => {
                callback(err, null);
            });
        } else {
            callback('unable to update password', null);
        }
    }).catch(err => {
        callback(err, null);
    });
}

PasswordResetController.prototype.tokenIsValid = function (token, callback) {
    if (!token) {
        callback(false);
        return;
    }

    const self = this;
    this.models.PasswordReset.findOne({
        where: { token: token },
    }).then(async passwordReset => {
        callback(passwordReset != null)
    }).catch(err => {
        callback(false)
    });
}

PasswordResetController.prototype.sendForgotPasswordEmail = function (email, appName, userFirstName, token) {
    const options = this.emailer.sendResetPasswordEmail(userFirstName, email, this.resetPasswordDomain(appName, token))
    this.emailer.sendMail(options);
}

PasswordResetController.prototype.resetPasswordDomain = function (appName, token) {
    return constants.CURRENT_DOMAIN + '/' + appName + '/' + resetPasswordDomain + "?resetToken=" + token
}

PasswordResetController.prototype.sendResetPasswordEmail = function (email) {
    const text = "Hello from Car Swaddle!\n\nYou've successfully changed your password!";
    const options = this.emailer.emailOptions(email, 'Car Swaddle password reset', text, null);
    this.emailer.sendMail(options);
}
