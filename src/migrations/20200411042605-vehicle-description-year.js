'use strict';
var Sequelize = require('sequelize');

module.exports = {
  up: (queryInterface) => {
    return queryInterface.changeColumn('vehicleDescription', 'year', {
      type: 'INTEGER using CAST("year" as INTEGER)',
      allowNull: true
    });
  },

  down: (queryInterface) => {
    return queryInterface.changeColumn('vehicleDescription', 'year', {
      type: Sequelize.STRING,
      allowNull: true
    });
  }
};
