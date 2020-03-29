'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('mechanic', 'chargeForTravel', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });
  },

  down: (queryInterface, Sequelize) => {
   return queryInterface.removeColumn('mechanic', 'chargeForTravel');
  }
};
