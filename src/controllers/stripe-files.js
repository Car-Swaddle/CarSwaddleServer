const constants = require('./constants.js');
// const { Op } = require('sequelize');
// const uuidV1 = require('uuid/v1');
const stripe = require('stripe')(constants.STRIPE_SECRET_KEY);

module.exports = function () {
    return new StripeFiles();
};

function StripeFiles() {
    this.init();
}

StripeFiles.prototype.init = function () {

};

StripeFiles.prototype.uploadIdentityDocument = function (image, name, mechanic, side, callback) {
    if (side != 'front' && side != 'back' && side != null) {
        callback(null, null);
    }

    var self = this;
    this.addStripeIdentityDocument(image, name, mechanic, async function (err, file) {
        if (err || file == null) {
            console.log(err);
            callback(err, null);
        }
        console.log(file.id);
        
        if (side == 'back') {
            mechanic.identityDocumentBackID = file.id;
        } else {
            mechanic.identityDocumentID = file.id;
        }
        await mechanic.save();
        self.updateMechanicIdentityDocument(file, mechanic, side, function (err, file) {
            callback(err, mechanic);
        });
    });
}

StripeFiles.prototype.addStripeIdentityDocument = function (image, name, mechanic, callback) {
    return stripe.files.create({
        file: {
            data: image.data,
            name: name,
            type: 'application/octet-stream',
        },
        purpose: 'identity_document',
    }, { stripe_account: mechanic.stripeAccountID }, async function (err, file) {
        callback(err, file);
    });
}

StripeFiles.prototype.updateMechanicIdentityDocument = function (file, mechanic, side, callback) {
    return stripe.accounts.update(mechanic.stripeAccountID, identityDocumentDict(file.id, side), function (err, file) {
        console.log(file);
        if (err != null) {
            console.log(err);
        }
        callback(err, file);
    });
}

function identityDocumentDict(file, side) {
    var dict = {
        individual: {
            verification: {
                document: {}
            }
        }
    }
    if (side == null) {
        dict['front'] = file;
    } else {
        dict.individual.verification.document[side] = file;
    }
    return dict;
}
