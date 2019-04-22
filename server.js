var express = require('express');
var models = require('./src/models');
var bodyParser = require('body-parser');
const stripe = require("stripe")("sk_test_FIXQgdKIimfTs9h2Rk88BFJ200B0WF7pE7");

stripe.setApiVersion("2019-03-14");
stripe.setAppInfo({
    name: "Car Swaddle Server Stripe Library",
    version: "1.0",
    url: "https://carswaddle.net"
});

bodyParser.limit = '500mb';

var app = express();
app.use(express.static(__dirname + '/www'));

var port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}
app.listen(port);

console.log('working on ' + port);

const passport = require('./passport')(models);

require('./src/routes')(app, models, passport);
