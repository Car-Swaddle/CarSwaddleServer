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
  Mechanic: sequelize.import('./mechanic'),
  Region: sequelize.import('./region'),
  TemplateTimeSpan: sequelize.import('./templateTimeSpan'),
  ServiceEntity: sequelize.import('./serviceEntity'),
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
