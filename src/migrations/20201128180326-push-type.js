'use strict';
var Sequelize = require('sequelize');

module.exports = {
  up: (queryInterface) => {
    
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

  down: (queryInterface) => {
    return new Promise(async (resolve, reject) => {
      await queryInterface.removeColumn('deviceToken', 'pushType');
      resolve();
    });
  },
};