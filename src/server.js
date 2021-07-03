const express = require('express');
const models = require('./models');
const constants = require('./controllers/constants');
const stripe = require("stripe")(constants.STRIPE_SECRET_KEY);
const pino = require('pino-http')(require('./util/pino-config'));
const cookieParser = require('cookie-parser');
const { reservationsUrl } = require('twilio/lib/jwt/taskrouter/util');

stripe.setAppInfo({
    name: "Car Swaddle Server Stripe Library",
    version: "1.0",
    url: constants.CURRENT_DOMAIN
});

const app = express();
app.use(pino);
app.use(cookieParser())
if(process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
    // Redirect all non-http heroku traffic to https
    app.use((req, res, next) => {
        if (req.header('x-forwarded-proto') !== 'https') {
            res.redirect(301, `https://${req.header('host')}${req.url}`)
        } else {
            next()
        }
    })
}

express.static.mime.define({'application/pkcs7-mime': ['apple-app-site-association']});
express.static.mime.define({'application/pkcs7-mime': ['.well-known/apple-app-site-association']});

const passport = require('./passport')(models);

require('./routes')(app, models, passport);

// Serve all static assets (.well-known, web app assets)
app.use(express.static(__dirname + '/public'));

// Fallback to serving web app for all other unknown paths
app.get('/*', (_, res) => {
    res.sendFile(__dirname + '/public/index.html');
})

var port = process.env.PORT;
if (port == null || port == "") {
    port = "3000";
}
app.listen(port);

console.log('working on ' + port);

// Gracefully handle heroku reboots
process.on('SIGTERM', shutdown('SIGTERM')).on('SIGINT', shutdown('SIGINT')).on('uncaughtException', shutdown('uncaughtException'));

function shutdown(signal) {
    return (err) => {
        console.log(`${ signal }...`);
        if (err) { console.error(err.stack || err) };
        setTimeout(() => {
            console.log('...waited 10s, exiting.');
            process.exit(err ? 1 : 0);
        }, 10_000).unref();
    };
}

process.on('warning', e => {console.warn(e.message); console.warn(e.stack)});
