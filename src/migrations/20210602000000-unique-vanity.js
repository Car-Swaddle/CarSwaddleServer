'use strict';
var Sequelize = require('sequelize');

module.exports = {
  async up(queryInterface) {
    return queryInterface.sequelize.query(`CREATE UNIQUE INDEX uidx_vanity_id ON referrer(TRIM(UPPER("vanityID")))`);
  },

  down: (queryInterface) => {
    return queryInterface.sequelize.query("DROP INDEX uidx_vanity_id");
  },
};