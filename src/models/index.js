const Sequelize = require('sequelize');

const sequelize = new Sequelize('carswaddle', 'kylekendall', 'password', {
  dialect: 'postgres',
});

const models = {
  User: sequelize.import('./user'),
  AutoService: sequelize.import('./autoService'),
  Location: sequelize.import('./location'),
  OilChange: sequelize.import('./oilChange'),
  Price: sequelize.import('./price'),
  PricePart: sequelize.import('./pricePart'),
  Vehicle: sequelize.import('./vehicle'),
  VehicleDescription: sequelize.import('./vehicleDescription'),
};

Object.keys(models).forEach(key => {
  if ('associate' in models[key]) {
    models[key].associate(models);
  }
});

models.sequelize = sequelize;
models.Sequelize = Sequelize;

module.exports = models;
