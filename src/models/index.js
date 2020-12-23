const { Sequelize } = require('sequelize');
const Reminder = require('../notifications/reminder.js');
const Umzug = require('umzug');

var sequelize = null;
// console.log('process.env.DATABASE: ' + process.env.DATABASE_URL);
// console.log('process.env: ' + JSON.stringify(process.env));

if (process.env.DATABASE_URL) {
  // the application is executed on Heroku
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect:  'postgres',
    protocol: 'postgres',
    logging:  true // false
  });
} else {
  // Local machine natively or docker
  sequelize = new Sequelize(
    'carswaddle',
    'kylekendall',
    'password', {
      dialect: 'postgres',
      host: process.env.LOCAL_DATABASE_URL || 'localhost',
      port: 5432
    }
  );
}

const models = {
  User: sequelize.import('./user'),
  AutoService: sequelize.import('./autoService'),
  Location: sequelize.import('./location'),
  OilChange: sequelize.import('./oilChange'),
  Price: sequelize.import('./price'),
  PricePart: sequelize.import('./pricePart'),
  Vehicle: sequelize.import('./vehicle'),
  VehicleDescription: sequelize.import('./vehicleDescription'),
  Mechanic: sequelize.import('./mechanic'),
  Region: sequelize.import('./region'),
  TemplateTimeSpan: sequelize.import('./templateTimeSpan'),
  ServiceEntity: sequelize.import('./serviceEntity'),
  DeviceToken: sequelize.import('./deviceToken'),
  Address: sequelize.import('./address'),
  Review: sequelize.import('./review'),
  Verification: sequelize.import('./verification'),
  TransactionMetadata: sequelize.import('./transaction-metadata'),
  TransactionReceipt: sequelize.import('./transaction-receipt'),
  MechanicMonthDebit: sequelize.import('./mechanic-month-debit'),
  MechanicPayoutDebit: sequelize.import('./mechanic-payout-debit'),
  OilChangePricing: sequelize.import('./oilChangePricing'),
  PasswordReset: sequelize.import('./passwordReset'),
  SubscriptionSettings: sequelize.import('./subscriptionSettings'),
  Authority: sequelize.import('./authority'),
  AuthorityConfirmation: sequelize.import('./authorityConfirmation'),
  AuthorityRequest: sequelize.import('./authorityRequest'),
  Coupon: sequelize.import('./coupon'),
  Referrer: sequelize.import('./referrer'),
  PayStructure: sequelize.import('./payStructure')
};

Object.keys(models).forEach(key => {
  console.log(key);
  if ('associate' in models[key]) {
    models[key].associate(models);
    console.log('associated ' + key);
  }
});

const umzug = new Umzug({
  migrations: {
    path: __dirname + '/../migrations', // Path from src/models
    params: [
      sequelize.getQueryInterface()
    ]
  },
  storage: 'sequelize',
  storageOptions: { sequelize }
});

// {force: true}
sequelize.sync().then(async function() {
  console.log("synced");
  // Run all migrations
  await umzug.up();
  console.log("Migrated");
  const reminder = new Reminder(models);
  reminder.rescheduleRemindersForAllAutoServices();
});
// .catch((err) => {
//   console.log("error: " + err);
// });

models.sequelize = sequelize;
models.Sequelize = Sequelize;

module.exports = models;
