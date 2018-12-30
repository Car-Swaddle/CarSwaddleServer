const Sequelize = require('sequelize');

var sequelize = null;
if (process.env.HEROKU_POSTGRESQL_CHARCOAL_URL) {
  // the application is executed on Heroku
  sequelize = new Sequelize(process.env.HEROKU_POSTGRESQL_CHARCOAL_URL, {
    dialect:  'postgres',
    protocol: 'postgres',
    // port:     match[4],
    // host:     match[3],
    logging:  true // false
  });
} else {
  // the application is executed on the local machine
  sequelize = new Sequelize('carswaddle', 'kylekendall', 'password', {
    dialect: 'postgres',
  });
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
};

Object.keys(models).forEach(key => {
  if ('associate' in models[key]) {
    models[key].associate(models);
  }
});

// {force: true}
sequelize.sync().then( function() {
  console.log("synced")
});

models.sequelize = sequelize;
models.Sequelize = Sequelize;

module.exports = models;
