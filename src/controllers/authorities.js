const constants = require('./constants.js');
// const { Op } = require('sequelize');
const uuidV1 = require('uuid/v1');
// const stripe = require('stripe')(constants.STRIPE_SECRET_KEY);
const emailFile = require('../notifications/email');

module.exports = function (models) {
    return new AuthoritiesController(models);
};

function AuthoritiesController(models) {
    this.models = models;
    this.emailer = new emailFile(models);
    this.init();
}

AuthoritiesController.prototype.init = function () {

};

AuthoritiesController.prototype.createAuthorityRequest = async function (userID, authority, callback) {
    var tomorrow = new Date(new Date().getTime() + (24 * 60 * 60 * 1000));
    this.models.AuthorityRequest.create({
        id: uuidV1(),
        secretID: uuidV1(),
        requesterID: userID,
        authorityName: authority,
        expirationDate: tomorrow
    }).then(authorityRequest => {
        callback(null, authorityRequest);
    }).catch(err => {
        callback(err, null);
    })
};