const express = require('express');
const models = require('./models');
const constants = require('./controllers/constants');
const bodyParser = require('body-parser');
const stripe = require("stripe")(constants.STRIPE_SECRET_KEY);
const pino = require('pino-http')(require('./util/pino-config'));

stripe.setAppInfo({
    name: "Car Swaddle Server Stripe Library",
    version: "1.0",
    url: constants.CURRENT_DOMAIN
});


console.log(__dirname)

// bodyParser.limit = '500mb';

const app = express();
app.use(pino);

express.static.mime.define({'application/pkcs7-mime': ['apple-app-site-association']});
express.static.mime.define({'application/pkcs7-mime': ['.well-known/apple-app-site-association']});

var port = process.env.PORT;
if (port == null || port == "") {
    port = "3000";
}
app.listen(port);

console.log('working on ' + port);

const passport = require('./passport')(models);

require('./routes')(app, models, passport);
// Should serve from /build/public
app.use(express.static(__dirname + '/public'));
