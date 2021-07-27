const constants = require('./constants.js');
const uuidV1 = require('uuid/v1');
const stripe = require('stripe')(constants.STRIPE_SECRET_KEY);
const { Util } = require('../util/util');

module.exports = function (models) {
    return new AccountCreation(models);
};

function AccountCreation(models) {
    this.models = models;
    this.init();
}

AccountCreation.prototype.init = function () {

};

AccountCreation.prototype.createStripeCustomerAccount = function (user, callback) {
    return stripe.customers.create({
        email: user.email
    }, function (err, customer) {
        if (customer == null || err != null) {
            callback(err, null, null);
            return;
        }
        user.stripeCustomerID = customer.id;
        user.save().then(user => {
            callback(err, customer, user);
            return;
        });
    });
}

AccountCreation.prototype.findOrCreateOilChangePricing = function (mechanic, callback) {
    this.models.OilChangePricing.findOrCreate({
        where: { mechanicID: mechanic.id },
        defaults: { id: uuidV1() }
    }).then(([oilChangePricing, created]) => {
        if (oilChangePricing.mechanicID == mechanic.id) {
            callback(null, oilChangePricing);
        } else {
            oilChangePricing.setMechanic(mechanic);
            oilChangePricing.save().then(oilChangePricing => {
                callback(null, oilChangePricing);
            }).catch(err => {
                callback(err, oilChangePricing);
            });
        }
    }).catch(err => {
        callback(err, null);
    });
}

AccountCreation.prototype.createStripeMechanicAccount = function (mechanic, remoteAddress, email, firstName, lastName, callback) {
    stripe.accounts.create(stripeCreateDict(remoteAddress, email, firstName, lastName)).then(stripeAccount => {
        mechanic.stripeAccountID = stripeAccount.id;
        mechanic.save().then(mechanic => {
            callback(null, mechanic);
        }).catch(err => {
            callback(err, null);
        });
    }).catch(err => {
        callback(err, null);
    });
}

AccountCreation.prototype.deleteMechanicAccount = function (mechanic, callback) {
    this.models.Mechanic.destroy({
        where: {
            id: mechanic.id
        }
    }).then(object => {
        callback(null);
    }).catch(err => {
        callback(err);
    });
}

AccountCreation.prototype.findOrCreateMechanic = function (user, callback) {
    this.models.Mechanic.findOrCreate({
        where: { userID: user.id },
        defaults: { isActive: true, id: uuidV1() }
    }).then(([mechanic, created]) => {
        if (created) {
            user.setMechanic(mechanic).then(function () {
                callback(user, mechanic, created);
            });
        } else {
            callback(user, mechanic, created);
        }
    }).catch(err => {
        callback(err, null, false);
    });
}

AccountCreation.prototype.completeMechanicCreationOrUpdate = function (user, remoteAddress, callback) {
    var self = this;
    this.findOrCreateMechanic(user, function (user, mechanic, created) {
        if (created == true || !mechanic.stripeAccountID) {
            self.createStripeMechanicAccount(mechanic, remoteAddress, user.email, user.firstName, user.lastName, function (err, stripeAccount) {
                if (err) {
                    self.deleteMechanicAccount(mechanic, function (deleteError) {
                        callback(err);
                    });
                } else {
                    self.findOrCreateOilChangePricing(mechanic, function (err, oilChangePricing) {
                        callback(err, mechanic);
                    });
                }
            });
        } else {
            self.findOrCreateOilChangePricing(mechanic, function (err, oilChangePricing) {
                if (mechanic.userID == user.id) {
                    callback(null, mechanic);
                } else {
                    user.setMechanic(mechanic).then(function () {
                        callback(null, mechanic);
                    });
                }
            });
        }
    });
}

function stripeCreateDict(ip, email, firstName, lastName) {
    if (ip.startsWith("fe80::")) { // fe80:: is a local ipv6 address
        ip = 'f7af:42da:51c6:7eb0:a076:8bea:7fb0:eb77'; // Randomly generated 
    }
    return {
        country: 'US',
        type: 'custom',
        tos_acceptance: {
            date: Math.floor(Date.now() / 1000),
            ip: ip
        },
        business_type: 'individual',
        capabilities: {
            transfers: { // renaming of 'platform_payments' for new api version
                requested: true
            }
        },
        individual: {
            email: email,
            first_name: firstName,
            last_name: lastName
        },
        email: email,
        business_profile: {
            product_description: 'This connect user is a mechanic who sells Oil changes through Car Swaddle'
        }
    }
}
