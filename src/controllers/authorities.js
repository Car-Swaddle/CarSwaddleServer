const constants = require('./constants.js');
const { Op } = require('sequelize');
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
    const self = this;
    this.models.AuthorityRequest.create({
        id: uuidV1(),
        secretID: uuidV1(),
        authorityName: authority,
        expirationDate: tomorrow
    }).then(async authorityRequest => {
        const user = await self.models.User.findById(userID);
        await authorityRequest.setUser(user, { save: true })
        self.models.AuthorityRequest.findById(authorityRequest.id, {
            include: [{
                model: self.models.User, attributes: self.models.User.defaultAttributes
            }, {
                model: self.models.AuthorityConfirmation
            }],
            attributes: self.models.AuthorityRequest.defaultAttributes
        }).then(fetchedRequest => {
            callback(null, fetchedRequest);
        }).catch(err => {
            callback(err, null);
        })
    }).catch(err => {
        callback(err, null);
    })
};

AuthoritiesController.prototype.fetchAuthorityRequests = function (limit, offset, pending, currentUserID, callback) {

    var options = {
        offset: offset || 0,
        limit: Math.min(limit || 30, 100),
        order: [['createdAt', 'DESC']],
        include: [{
            model: this.models.User, attributes: this.models.User.defaultAttributes
        }, {
            model: this.models.AuthorityConfirmation
        }, {
            model: this.models.Authority
        }]
    }

    if (pending == "true") {
        options.where = {
            '$authorityConfirmation$': null,
            'expirationDate': {
                [Op.gt]: new Date()
            }
        }
    } else if (pending == "false") {
        options.where = {
            '$authorityConfirmation$': {
                [Op.ne]: null
            },
            'expirationDate': {
                [Op.gt]: new Date()
            }
        }
    } else {
        options.where = {
            'expirationDate': {
                [Op.gt]: new Date()
            }
        }
    }

    const self = this;
    this.fetchAuthorityForUser(currentUserID, this.models.Authority.NAME.editAuthorities, function (err, authority) {

        var attributes = self.models.AuthorityRequest.defaultAttributes;
        if (authority) {
            attributes.push('secretID');
        }
        options.attributes = attributes;

        self.models.AuthorityRequest.findAll(options).then(authorityRequests => {
            callback(null, authorityRequests);
        }).catch(err => {
            callback(err, null);
        });
    });

    // Include secretID if current user has editAuthorit
};


AuthoritiesController.prototype.fetchAuthorities = function (limit, offset, callback) {
    this.models.Authority.findAll({
        offset: offset || 0,
        limit: Math.min(limit || 30, 100),
        order: [['createdAt', 'DESC']],
        include: [
            {
            model: this.models.AuthorityConfirmation,
            include: {
                model: this.models.User, attributes: this.models.User.defaultAttributes
            }
        }, 
        {
            model: this.models.User, attributes: this.models.User.defaultAttributes
        }]
    }).then(authorities => {
        callback(null, authorities);
    }).catch(err => {
        callback(err, null);
    });
};

AuthoritiesController.prototype.fetchAuthoritiesForUser = function (userID, callback) {
    this.models.Authority.findAll({
        where: {
            userID: userID
        },
        order: [['createdAt', 'DESC']],
        include: [
            {
            model: this.models.AuthorityConfirmation,
            include: {
                model: this.models.User, attributes: this.models.User.defaultAttributes
            }
        }, 
        {
            model: this.models.User, attributes: this.models.User.defaultAttributes
        }]
    }).then(authorities => {
        callback(null, authorities);
    }).catch(err => {
        callback(err, null);
    });
};

AuthoritiesController.prototype.fetchAuthorityForUser = function (userID, authority, callback) {
    this.models.Authority.findOne({
        where: { userID: userID, authorityName: authority }
    }).then(authority => {
        callback(null, authority);
    }).catch(err => {
        callback(err, null);
    })
}
