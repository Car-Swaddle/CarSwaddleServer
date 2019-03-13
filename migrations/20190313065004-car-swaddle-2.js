'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
   return queryInterface.createTable('mechanicMonthDebit', {
    createdAt: Sequelize.DATE,
    updatedAt: Sequelize.DATE,
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    debitMonth: {
      type: Sequelize.INTEGER
    },
    debitYear: {
      type: Sequelize.INTEGER
    }
  }).then(() => queryInterface.createTable('mechanicPayoutDebit', {
    createdAt: Sequelize.DATE,
    updatedAt: Sequelize.DATE,
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    payoutID: {
        type: Sequelize.STRING,
        allowNull: false
    },
    mechanicID: {
        type: Sequelize.STRING,
        allowNull: false
    }
  })).then(() => queryInterface.addColumn('address', 'line2', {
      type: Sequelize.STRING
    }
  ));
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
   return queryInterface.dropTable('mechanicMonthDebit')
   .then(() => queryInterface.dropTable('mechanicPayoutDebit'))
   .then(() => {
     return queryInterface.removeColumn( 'address', 'line2');
   });
  }
};
