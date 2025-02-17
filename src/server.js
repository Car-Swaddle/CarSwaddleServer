const express = require('express');
const models = require('./models');
const constants = require('./controllers/constants');
const stripe = require("stripe")(constants.STRIPE_SECRET_KEY);
const pino = require('pino-http')(require('./util/pino-config'));
const cookieParser = require('cookie-parser');
const path = require('path');

stripe.setAppInfo({
    name: "Car Swaddle Server Stripe Library",
    version: "1.0",
    url: constants.CURRENT_DOMAIN
});

const app = express();
app.use(pino);
app.use(cookieParser())
app.set('trust proxy', 1); // Enable rate limiter to work with heroku
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
const basePath = path.join(__dirname, '../build/public');
app.use(express.static(basePath));

// Fallback to serving web app for all other unknown paths
app.get('/*', (_, res) => {
    res.sendFile(basePath + '/index.html');
})

// Catch-all error handler
app.use(function (error, req, res, next) {
    if (process.env.NODE_ENV === 'production') {
        res.status(500).send({error: "Unknown error"})
        return next(error);
    }
    console.error(error?.stack ?? error.message);
    res.status(400).send({ error: error.message, stack: error?.stack });
    return next(error);
});

module.exports = { app };
