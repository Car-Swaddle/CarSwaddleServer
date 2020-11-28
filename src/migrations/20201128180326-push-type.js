'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    
    return new Promise((resolve, reject) => {
      queryInterface.describeTable('deviceToken').then(async definition => {
        if (definition.pushType) {
          console.log("Push type already exists");
          return resolve();
        }
        await queryInterface.addColumn('deviceToken', 'pushType', {
          type: Sequelize.STRING,
          allowNull: false,
          defaultValue: "APNS"
        });
        // Resolve to mark completed in db
        resolve();
      });
    });
  },

  down: (queryInterface, Sequelize) => {
    return new Promise(async (resolve, reject) => {
      await queryInterface.removeColumn('deviceToken', 'pushType');
      resolve();
    });
  },
};