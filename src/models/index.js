const { Sequelize } = require('sequelize');
const DataTypes = require('sequelize/lib/data-types');
const Reminder = require('../notifications/reminder.js');
const Umzug = require('umzug');
const logger = require('pino')()
import vehicle from "./vehicle";

var sequelize = null;
// console.log('process.env.DATABASE: ' + process.env.DATABASE_URL);
// console.log('process.env: ' + JSON.stringify(process.env));

if (process.env.DATABASE_URL) {
  // the application is executed on Heroku
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect:  'postgres',
    dialectOptions: {
      ssl: {
        rejectUnauthorized: false
      }
    },
    protocol: 'postgres',
    logging: (sql, timing) => logger.info({sql: sql, timing: timing}), // false to disable
    benchmark: true,
    // TODO - pool and add timeouts for prod
  });
} else {
  // Local machine natively or docker
  sequelize = new Sequelize(
    'carswaddle',
    'kylekendall',
    'password', {
      dialect: 'postgres',
      host: process.env.LOCAL_DATABASE_URL || 'localhost',
      port: 5432,
      logging: (sql, timing) => logger.info({sql: sql, timing: timing}),
      benchmark: true,
      // TODO - re-enable these once migrated to sequelize v5+
      // dialectOptions: {
      //   statement_timeout: 30000,
      //   query_timeout: 30000,
      //   connnectionTimeoutMillis: 30000,
      //   idle_in_transaction_session_timeout: 60000
      // },
      // pool: {
      //   max: 5,
      //   min: 0,
      //   acquire: 30000,
      //   idle: 10000
      // }
    }
  );
}

const models = {
  User: require('./user')(sequelize, DataTypes),
  AutoService: require('./autoService')(sequelize, DataTypes),
  Location: require('./location')(sequelize, DataTypes),
  OilChange: require('./oilChange')(sequelize, DataTypes),
  Price: require('./price')(sequelize, DataTypes),
  PricePart: require('./pricePart')(sequelize, DataTypes),
  Vehicle: vehicle(sequelize, DataTypes),
  VehicleDescription: require('./vehicleDescription')(sequelize, DataTypes),
  Mechanic: require('./mechanic')(sequelize, DataTypes),
  Region: require('./region')(sequelize, DataTypes),
  TemplateTimeSpan: require('./templateTimeSpan')(sequelize, DataTypes),
  ServiceEntity: require('./serviceEntity')(sequelize, DataTypes),
  DeviceToken: require('./deviceToken')(sequelize, DataTypes),
  Address: require('./address')(sequelize, DataTypes),
  Review: require('./review')(sequelize, DataTypes),
  Verification: require('./verification')(sequelize, DataTypes),
  TransactionMetadata: require('./transaction-metadata')(sequelize, DataTypes),
  TransactionReceipt: require('./transaction-receipt')(sequelize, DataTypes),
  MechanicMonthDebit: require('./mechanic-month-debit')(sequelize, DataTypes),
  MechanicPayoutDebit: require('./mechanic-payout-debit')(sequelize, DataTypes),
  OilChangePricing: require('./oilChangePricing')(sequelize, DataTypes),
  PasswordReset: require('./passwordReset')(sequelize, DataTypes),
  SubscriptionSettings: require('./subscriptionSettings')(sequelize, DataTypes),
  Authority: require('./authority')(sequelize, DataTypes),
  AuthorityConfirmation: require('./authorityConfirmation')(sequelize, DataTypes),
  AuthorityRequest: require('./authorityRequest')(sequelize, DataTypes),
  Coupon: require('./coupon')(sequelize, DataTypes),
  Referrer: require('./referrer')(sequelize, DataTypes),
  PayStructure: require('./payStructure')(sequelize, DataTypes),
};

Object.keys(models).forEach(key => {
  // console.debug(key);
  if ('associate' in models[key]) {
    models[key].associate(models);
    // console.debug('associated ' + key);
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

umzug.up().then(() => {
  console.log("Finished migrations")
  const reminder = new Reminder(models);
  reminder.rescheduleRemindersForAllAutoServices();
})
.catch((err) => {
  console.error("Error during migrations: " + err);
});

models.sequelize = sequelize;

module.exports = models;
