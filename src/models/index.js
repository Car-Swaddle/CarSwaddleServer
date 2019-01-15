const Sequelize = require('sequelize');

var sequelize = null;
console.log('process.env.DATABASE: ' + process.env.DATABASE_URL);
console.log('process.env: ' + process.env);
if (process.env.DATABASE_URL) {
  // the application is executed on Heroku
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect:  'postgres',
    protocol: 'postgres',
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
  Review: sequelize.import('./review'),
  Verification: sequelize.import('./verification'),
};

Object.keys(models).forEach(key => {
  console.log(key);
  if ('associate' in models[key]) {
    models[key].associate(models);
    console.log('associated ' + key);
  }
});

// {force: true}
sequelize.sync().then( function() {
  console.log("synced")
});

models.sequelize = sequelize;
models.Sequelize = Sequelize;

module.exports = models;
