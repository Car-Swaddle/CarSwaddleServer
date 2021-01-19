'use strict';
var Sequelize = require('sequelize');

const transactionMetadataTableName = 'transactionMetadata';

module.exports = {
  async up(queryInterface) {


    let definition = await queryInterface.describeTable(transactionMetadataTableName);
    if (definition.paymentIntentID) {
        console.warn(`Payment intent id already exists on ${transactionMetadataTableName}, skipping migration`);
        return;
    }
    
    const transaction = await queryInterface.sequelize.transaction();

    try {
        await queryInterface.addColumn(transactionMetadataTableName, 'paymentIntentID', {
            type: Sequelize.STRING,
            allowNull: true,
        }, { transaction });
        await queryInterface.addColumn(transactionMetadataTableName, 'referrerCost', {
            type: Sequelize.INTEGER,
            allowNull: true,
        }, { transaction });
        await queryInterface.addColumn(transactionMetadataTableName, 'mechanicTransferID', {
            type: Sequelize.STRING,
            allowNull: true,
        }, { transaction });
        await queryInterface.addColumn(transactionMetadataTableName, 'referrerTransferID', {
            type: Sequelize.STRING,
            allowNull: true,
        }, { transaction });
        await queryInterface.addColumn(transactionMetadataTableName, 'audit', {
            type: Sequelize.JSON,
            allowNull: true,
        }, { transaction });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
  },

  down: (queryInterface) => {
    return new Promise(async (resolve, reject) => {
      await queryInterface.removeColumn(transactionMetadataTableName, 'paymentIntentID');
      await queryInterface.removeColumn(transactionMetadataTableName, 'referrerCost');
      await queryInterface.removeColumn(transactionMetadataTableName, 'mechanicTransferID');
      await queryInterface.removeColumn(transactionMetadataTableName, 'referrerTransferID');
      await queryInterface.removeColumn(transactionMetadataTableName, 'audit');
      resolve();
    });
  },
};