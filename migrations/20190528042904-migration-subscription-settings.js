'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
    return queryInterface.createTable('subscriptionSettings', {
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        unique: true
      },
      userID: {
        type: Sequelize.STRING,
        allowNull: false
      },
      sendReminderEmails: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      unsubscribeID: {
        type: Sequelize.STRING,
        allowNull: false
      },
    });
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
   return queryInterface.dropTable('subscriptionSettings');
  }
};
