'use strict';
var Sequelize = require('sequelize');

const payStructureTableName = 'payStructure';

module.exports = {
  async up(queryInterface) {
    return queryInterface.renameColumn(payStructureTableName, 'percentageOfPurchase', 'percentageOfProfit');
  },

  down: (queryInterface) => {
    return Promise.resolve();
  },
};