import { Sequelize, DataTypes } from 'sequelize';
import { PayStructureFactory } from './payStructure';
import { ReferrerFactory } from './referrer';
import { Models } from './types'
import Umzug from 'umzug';
import vehicle from "./vehicle";
const Reminder = require('../notifications/reminder.js');
const logger = require('pino')()

var sequelize = null;

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
    define: {
      freezeTableName: true
    }
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
      define: {
        freezeTableName: true
      }
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

const User = require('./user')(sequelize, DataTypes);
const AutoService = require('./autoService')(sequelize, DataTypes);
const Location = require('./location')(sequelize, DataTypes);
const OilChange = require('./oilChange')(sequelize, DataTypes);
const Price = require('./price')(sequelize, DataTypes);
const PricePart = require('./pricePart')(sequelize, DataTypes);
const Vehicle = vehicle(sequelize, DataTypes);
const VehicleDescription = require('./vehicleDescription')(sequelize, DataTypes);
const Mechanic = require('./mechanic')(sequelize, DataTypes);
const Region = require('./region')(sequelize, DataTypes);
const TemplateTimeSpan = require('./templateTimeSpan')(sequelize, DataTypes);
const ServiceEntity = require('./serviceEntity')(sequelize, DataTypes);
const DeviceToken = require('./deviceToken')(sequelize, DataTypes);
const Address = require('./address')(sequelize, DataTypes);
const Review = require('./review')(sequelize, DataTypes);
const Verification = require('./verification')(sequelize, DataTypes);
const TransactionMetadata = require('./transaction-metadata')(sequelize, DataTypes);
const TransactionReceipt = require('./transaction-receipt')(sequelize, DataTypes);
const MechanicMonthDebit = require('./mechanic-month-debit')(sequelize, DataTypes);
const MechanicPayoutDebit = require('./mechanic-payout-debit')(sequelize, DataTypes);
const OilChangePricing = require('./oilChangePricing')(sequelize, DataTypes);
const PasswordReset = require('./passwordReset')(sequelize, DataTypes);
const SubscriptionSettings = require('./subscriptionSettings')(sequelize, DataTypes);
const Authority = require('./authority')(sequelize, DataTypes);
const AuthorityConfirmation = require('./authorityConfirmation')(sequelize, DataTypes);
const AuthorityRequest = require('./authorityRequest')(sequelize, DataTypes);
const Coupon = require('./coupon')(sequelize, DataTypes);

// Typescript model definitions
const PayStructure = PayStructureFactory(sequelize);
const Referrer = ReferrerFactory(sequelize);

// Typescript model relationships
//   Note: only one side of relationship required, prefer defining belongs side (belongsTo, belongsToMany)
PayStructure.belongsTo(Referrer, {
  foreignKey: "referrerID"
});
Referrer.belongsTo(User, {
  foreignKey: "userID",
  constraints: true
});

// Relationships to add (when ready):
// Coupon belongs to -> Referrer

const models: Models = {
  sequelize,
  PayStructure,
  Referrer,

  User,
  AutoService,
  Location,
  OilChange,
  Price,
  PricePart,
  Vehicle,
  VehicleDescription,
  Mechanic,
  Region,
  TemplateTimeSpan,
  ServiceEntity,
  DeviceToken,
  Address,
  Review,
  Verification,
  TransactionMetadata,
  TransactionReceipt,
  MechanicMonthDebit,
  MechanicPayoutDebit,
  OilChangePricing,
  PasswordReset,
  SubscriptionSettings,
  Authority,
  AuthorityConfirmation,
  AuthorityRequest,
  Coupon,
};

export = models;

Object.entries(models).forEach(([key, model]) => {
  // console.debug(key);
  if ('associate' in model) {
    model.associate(models);
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
.catch((err: Error) => {
  console.error("Error during migrations: " + err);
});
