const constants = require('../../controllers/constants.js');
var twilioFramework = require('twilio');
var twilio = new twilioFramework(constants.TWILIO_SID, constants.TWILIO_AUTH_TOKEN);
const bodyParser = require('body-parser');
const phone = require('../../controllers/phone-verification.js')();

module.exports = function (app, models) {

    app.get('/sms/send', bodyParser.json(), async function (req, res) {
        if (req.user == null) {
            return res.status(400).send();
        }
        // twilio.messages.create({
        //     body: 'new test',
        //     to: '+13853124608',
        //     from: constants.TWILIO_PHONE
        // }).then(message => {
        //     console.log(message)
        //     return res.json(message);
        // });
    });

    app.get('/sms/send-verification', bodyParser.json(), async function (req, res) {
        if (!req.user || !req.user.phoneNumber) {
            return res.status(400).send();
        }
        if (req.user.isPhoneNumberVerified == true) {
            return res.status(409).send('already verified');
        }
        phone.requestPhoneVerification(req.user.phoneNumber, null, null, function (err, response) {
            if (!err) {
                return res.status(200).send();
            } else {
                return res.status(400).send('unable to send verification code');
            }
        });
    });

    app.get('/sms/verify', bodyParser.json(), async function (req, res) {
        if (!req.user || !req.query.code) {
            return res.status(400).send();
        }
        if (req.user.isPhoneNumberVerified == true) {
            return res.status(409).send('already verified');
        }
        phone.verifyPhoneToken(req.user.phoneNumber, null, req.query.code, function (err, response) {
            if (!err) {
                req.user.isPhoneNumberVerified = true;
                req.user.save().then(user => {
                    return res.status(200).json(user);
                });
            } else {
                return res.status(400).send('did not verify code');
            }
        });
    });

};
