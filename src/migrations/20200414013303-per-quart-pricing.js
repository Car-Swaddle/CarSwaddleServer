'use strict';
var Sequelize = require('sequelize');
const constants = require('../controllers/constants');

module.exports = {
  up: (queryInterface) => {
    return new Promise((resolve, reject) => {
      queryInterface.describeTable('oilChangePricing').then(async definition => {
        if (definition.conventionalPerQuart) {
          // Assume if one exists, they all exist
          console.log("Oil change pricing per quart already exists");
          return resolve();
        }
        await queryInterface.addColumn('oilChangePricing', 'conventionalPerQuart', {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: constants.DEFAULT_CONVENTIONAL_PRICE_PER_QUART
        });
        await queryInterface.addColumn('oilChangePricing', 'blendPerQuart', {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: constants.DEFAULT_BLEND_PRICE_PER_QUART
        });
        await queryInterface.addColumn('oilChangePricing', 'syntheticPerQuart', {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: constants.DEFAULT_SYNTHETIC_PRICE_PER_QUART
        });
        await queryInterface.addColumn('oilChangePricing', 'highMileagePerQuart', {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: constants.DEFAULT_HIGH_MILEAGE_PRICE_PER_QUART
        });
        // Resolve to mark completed in db
        resolve();
      });
    });
  },

  down: (queryInterface) => {
    return new Promise(async (resolve, reject) => {
      await queryInterface.removeColumn('oilChangePricing', 'conventionalPerQuart');
      await queryInterface.removeColumn('oilChangePricing', 'blendPerQuart');
      await queryInterface.removeColumn('oilChangePricing', 'syntheticPerQuart');
      await queryInterface.removeColumn('oilChangePricing', 'highMileagePerQuart');
      resolve();
    });
  }
};
