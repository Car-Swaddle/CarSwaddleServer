const constants = require('./constants');
const bodyParser = require('body-parser');

const emailer = require('../notifications/email.js');

// Create the transporter with the required configuration for Outlook
// change the user and pass !
// var transporter = nodemailer.createTransport({
//     host: "smtp-mail.outlook.com", // hostname
//     secureConnection: false, // TLS requires secureConnection to be false
//     port: 587, // port for secure SMTP
//     tls: {
//         ciphers: 'SSLv3'
//     },
//     auth: {
//         user: 'kyle@carswaddle.com',
//         pass: 'carswaddleftw1"'
//     }
// });

// var transporter = nodemailer.createTransport({
//     host: 'smtp.office365.com', // Office 365 server
//     port: 587,     // secure SMTP
//     secure: false, // false for TLS - as a boolean not string - but the default is false so just remove this completely
//     auth: {
//         user: username,
//         pass: password
//     },
//     tls: {
//         ciphers: 'SSLv3'
//     }
// });

const ONE_HOUR = 60 * 60 * 1000; /* ms */
const ONE_DAY = ONE_HOUR * 24;

const MAX_TIME = ONE_DAY;

module.exports = function (app, models) {

    app.get('/email/verify', bodyParser.json(), async function (req, res, next) {
        const id = req.query.id;
        if (id == null) {
            return res.status(400).send('not verified');
        }

        const verification = await models.Verification.findById(id);

        if (verification == null || verification.resourceType != 'user' || ((new Date) - verification.creationDate) > MAX_TIME) {
            return res.status(400).send('not verified');
        }

        const user = await models.User.findById(verification.resourceID);

        if (user == null) {
            return res.status(400).send('not verified');
        }

        if (user.isEmailVerified == true) {
            return res.status(400).send('already verified');
        }

        user.isEmailVerified = true;
        user.save().then(user => {
            return res.status(200).end('successfully verified');
        }).catch(err => {
            return res.status(400).send('not verified');
        });

        // console.log(req.protocol + ":/" + req.get('host'));
        // // if ((req.protocol + "://" + req.get('host')) == ("http://" + host)) {
        //     console.log("Domain is matched. Information is from Authentic email");
        //     if (req.query.id == rand) {
        //         console.log("email is verified");
        //         res.end("<h1>Email " + mailOptions.to + " is been Successfully verified");
        //     } else {
        //         console.log("email is not verified");
        //         res.end("<h1>Bad Request</h1>");
        //     }
        // } else {
        //     res.end("<h1>Request is from unknown source");
        // }
    });

};