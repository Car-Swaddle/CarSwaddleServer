'use strict';

const constants = require('../src/controllers/constants.js');

module.exports = {
  up: (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
    return queryInterface.createTable('oilChangePricing', {
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        unique: true,
      },
      conventional: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: constants.DEFAULT_CONVENTIONAL_PRICE
      },
      blend: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: constants.DEFAULT_BLEND_PRICE
      },
      synthetic: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: constants.DEFAULT_SYNTHETIC_PRICE
      },
      highMileage: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: constants.DEFAULT_HIGH_MILEAGE_PRICE
      },
      centsPerMile: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: constants.DEFAULT_CENTS_PER_MILE
      },
      mechanicID: {
        type: Sequelize.UUID,
        references: {
          model: 'mechanic',
          key: 'id'
        }
      }
    });
},

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
    return queryInterface.dropTable('oilChangePricing');
  }
};
