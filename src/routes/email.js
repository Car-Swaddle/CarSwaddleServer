const constants = require('./constants');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

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
        pass: '80claSSic*02'
    }
});

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

var rand;

module.exports = function (app, models) {

    app.get('/email/send', bodyParser.json(), function (req, res, next) {
        // setup e-mail data, even with unicode symbols
        // var mailOptions = {
        //     from: '"Our Code World " <kyle@carswaddle.com>', // sender address (who sends)
        //     to: 'kkendall33@gmail.com', // list of receivers (who receives)
        //     subject: req.query.title || 'The title', // Subject line
        //     text: 'Hello world ', // plaintext body
        //     html: '<b>Hello world </b><br> This is the first email sent with Nodemailer in Node.js' // html body
        // };
        rand = Math.floor((Math.random() * 100) + 54);
        const host = req.get('host');
        const link = "http://" + 'Kyles-MacBook-Pro.local:3000' + "/email/verify?id=" + rand;
        // const mailOptions = {
        //     from: 'Kyle <kyle@carswaddle.com>', // sender address (who sends)
        //     to: 'kkendall33@gmail.com', // list of receivers (who receives)
        //     subject: 'original that',
        //     text: 'Hello, please Click on the link to verify your email. ' + link + ' Click the link to verify',
        //     html: 'Hello,<br> Please Click on the link to verify your email.<br><a href=' + link + '>Click here to verify</a>'
        // };

        const mailOptions = {
            from: '"Our Code World " <kyle@carswaddle.com>', // sender address (who sends)
            to: 'kkendall33@gmail.com', // list of receivers (who receives)
            subject: req.query.title || 'The title', // Subject line
            text: 'Hello world ', // plaintext body
            html: '<b>Hello world </b><br> This is the first email sent with Nodemailer in Node.js. ' + link // html body
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                return res.status(400).send('400');
            }

            console.log('Message sent: ' + info.response);
            return res.status(200).send('200');
        });
    });

    app.get('/email/verify', bodyParser.json(), function (req, res, next) {
        console.log(req.protocol + ":/" + req.get('host'));
        // if ((req.protocol + "://" + req.get('host')) == ("http://" + host)) {
            console.log("Domain is matched. Information is from Authentic email");
            if (req.query.id == rand) {
                console.log("email is verified");
                res.end("<h1>Email " + mailOptions.to + " is been Successfully verified");
            } else {
                console.log("email is not verified");
                res.end("<h1>Bad Request</h1>");
            }
        // } else {
        //     res.end("<h1>Request is from unknown source");
        // }
    });

};