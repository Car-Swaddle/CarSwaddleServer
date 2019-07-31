const express = require('express');
const models = require('./src/models');
const constants = require('./src/controllers/constants');
const bodyParser = require('body-parser');
const stripe = require("stripe")(constants.STRIPE_SECRET_KEY);

stripe.setAppInfo({
    name: "Car Swaddle Server Stripe Library",
    version: "1.0",
    url: constants.CURRENT_DOMAIN
});

bodyParser.limit = '500mb';

const app = express();
app.use(express.static(__dirname + '/www'));

const port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}
app.listen(port);

console.log('working on ' + port);

const passport = require('./passport')(models);

require('./src/routes')(app, models, passport);
