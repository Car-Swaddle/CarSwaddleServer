var Sequelize = require('sequelize');

module.exports = {
  up: (queryInterface) => {
    return new Promise((resolve, reject) => {
      queryInterface.describeTable('mechanic').then(definition => {
        if (!definition.chargeForTravel) {
          queryInterface.addColumn('mechanic', 'chargeForTravel', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true
          });
          // Resolve to mark completed in db
          resolve();
        } else {
          console.log("Column already exists");
          resolve();
        }
      });
    });
  },

  down: (queryInterface) => {
   return queryInterface.removeColumn('mechanic', 'chargeForTravel');
  }
};
