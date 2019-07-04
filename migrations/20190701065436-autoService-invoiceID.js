'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('autoService', 'invoiceID', {
      type: Sequelize.STRING,
      allowNull: false
    });
  },

  down: (queryInterface, Sequelize) => {
   return queryInterface.removeColumn('autoService', 'invoiceID');
  }
};
