const useStripeLive = process.env.STRIPE_LIVE === 'YES';

module.exports = Object.freeze({
    BOOKING_FEE_PERCENTAGE: 0.10,
    DEFAULT_CONVENTIONAL_PRICE: 4500, // in cents
    DEFAULT_CONVENTIONAL_PRICE_PER_QUART: 900, // in cents
    DEFAULT_BLEND_PRICE: 5000, // in cents
    DEFAULT_BLEND_PRICE_PER_QUART: 1000, // in cents
    DEFAULT_SYNTHETIC_PRICE: 5600, // in cents
    DEFAULT_SYNTHETIC_PRICE_PER_QUART: 1120, // in cents
    DEFAULT_HIGH_MILEAGE_PRICE: 5850, // in cents
    DEFAULT_HIGH_MILEAGE_PRICE_PER_QUART: 1170, // in cents
    DEFAULT_CENTS_PER_MILE: 50, // in cents
    DEFAULT_QUARTS_COUNT: 5.0,
    STRIPE_WEBHOOK_KEY: useStripeLive ? process.env.STRIPE_WEBHOOK_KEY : 'whsec_6Ow0KxEn4hqBvi77tAAdets83KNAZRO5',
    STRIPE_WEBHOOK_KEY_CONNECT: useStripeLive ? process.env.STRIPE_WEBHOOK_KEY_CONNECT : 'whsec_NZ2S54mDSbeRpWB5NDVXOGrVxJpOyEY0',    
    STRIPE_SECRET_KEY: useStripeLive ? process.env.STRIPE_SECRET_KEY : 'sk_test_FIXQgdKIimfTs9h2Rk88BFJ200B0WF7pE7',  
    STRIPE_PUBLISHABLE_KEY: useStripeLive ? "pk_live_ZJkoNBROBK0ttmZLDNfNF0Cw00VwQ7JjFw" : "pk_test_93FPMcPQ4mSaWfjtMWlkGvDr00ytb8KnDJ",
    STRIPE_CONNECT_CLIENT_ID: useStripeLive ? "ca_Ev4P3GYnV9zLuKcJAQGSbIc15c614wzV": "ca_Ev4P1QZsqdxi1oJzS9SrXyooFCGiI4mC",
    STRIPE_PLATFORM_ACCOUNT_ID: 'acct_1EGAxMDGwCXJzLur', // carswaddle.net
    TWILIO_SID: 'AC347857af1bb465179b76b5a273c68e87',
    TWILIO_AUTH_TOKEN: 'fb54bdcc2d5a762269c53b20966ab408',
    TWILIO_PHONE: '+17727636586',
    ADMIN_SECRET: '169ed15a-e030-4f59-86c7-8684bf6ef628',
    CURRENT_DOMAIN: currentDomain(),
    
});

function currentDomain() {
    if (process.env.ENV == 'production') {
        return 'api.carswaddle.com';
    } else if (process.env.ENV == 'staging') {
        return 'api.staging.carswaddle.com';
    } else {
        return 'localhost';
        // http://[::1]:3000
    }
}
