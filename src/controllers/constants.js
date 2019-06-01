module.exports = Object.freeze({
    BOOKING_FEE_PERCENTAGE: 0.10,
    DEFAULT_CONVENTIONAL_PRICE: 4500, // in cents
    DEFAULT_BLEND_PRICE: 5000, // in cents
    DEFAULT_SYNTHETIC_PRICE: 5600, // in cents
    DEFAULT_HIGH_MILEAGE_PRICE: 5850, // in cents
    DEFAULT_CENTS_PER_MILE: 50, // in cents
    STRIPE_SECRET_KEY: 'sk_test_FIXQgdKIimfTs9h2Rk88BFJ200B0WF7pE7',
    STRIPE_PLATFORM_ACCOUNT_ID: 'acct_1EGAxMDGwCXJzLur', // carswaddle.net
    TWILIO_SID: 'AC347857af1bb465179b76b5a273c68e87',
    TWILIO_AUTH_TOKEN: 'fb54bdcc2d5a762269c53b20966ab408',
    TWILIO_PHONE: '+17727636586',
    ADMIN_SECRET: '169ed15a-e030-4f59-86c7-8684bf6ef628',
    CURRENT_DOMAIN: currentDomain(),
});

function stripeSecretKeyForCurrentEnvironment() {
    if (process.env.ENV == 'production') {
        // return 'pk_live_ZJkoNBROBK0ttmZLDNfNF0Cw00VwQ7JjFw';
        return 'sk_test_FIXQgdKIimfTs9h2Rk88BFJ200B0WF7pE7';

    } else if (process.env.ENV == 'staging') {
        return 'sk_test_FIXQgdKIimfTs9h2Rk88BFJ200B0WF7pE7';
    } else if (process.env.ENV == 'dev') {
        return 'sk_test_FIXQgdKIimfTs9h2Rk88BFJ200B0WF7pE7';
    }
}

function currentDomain() {
    if (process.env.ENV == 'production') {
        return 'www.carswaddle.com';
    } else if (process.env.ENV == 'staging') {
        return 'www.safe-ridge-47447.herokuapp.com';
    } else if (process.env.ENV == 'dev') {
        return 'localhost';
        // http://[::1]:3000
    }
}
