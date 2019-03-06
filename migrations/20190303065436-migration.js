'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
    return queryInterface.addColumn('user', 'timeZone', Sequelize.STRING, {
      defaultValue: 'America/Denver'
    }).then(() => queryInterface.createTable('mechanicMonthDebit', {
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      debitMonth: {
        type: DataTypes.INTEGER
      },
      debitYear: {
        type: DataTypes.INTEGER
      }
    }));
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
    return queryInterface.removeColumn('User', 'timeZone', Sequelize.STRING)
      .then(() => queryInterface.dropTable('mechanicMonthDebit'));
  }
};
