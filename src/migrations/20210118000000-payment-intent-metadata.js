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
        await queryInterface.addColumn(transactionMetadataTableName, 'stripePaymentIntentID', {
            type: Sequelize.STRING,
            allowNull: true,
        }, { transaction });
        await queryInterface.addColumn(transactionMetadataTableName, 'mechanicTransferAmount', {
            type: Sequelize.INTEGER,
            allowNull: true,
        }, { transaction });
        await queryInterface.addColumn(transactionMetadataTableName, 'referrerTransferAmount', {
            type: Sequelize.INTEGER,
            allowNull: true,
        }, { transaction });
        await queryInterface.addColumn(transactionMetadataTableName, 'stripeMechanicTransferID', {
            type: Sequelize.STRING,
            allowNull: true,
        }, { transaction });
        await queryInterface.addColumn(transactionMetadataTableName, 'stripeReferrerTransferID', {
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
      await queryInterface.removeColumn(transactionMetadataTableName, 'stripePaymentIntentID');
      await queryInterface.removeColumn(transactionMetadataTableName, 'mechanicTransferAmount');
      await queryInterface.removeColumn(transactionMetadataTableName, 'referrerTransferAmount');
      await queryInterface.removeColumn(transactionMetadataTableName, 'stripeMechanicTransferID');
      await queryInterface.removeColumn(transactionMetadataTableName, 'stripeReferrerTransferID');
      await queryInterface.removeColumn(transactionMetadataTableName, 'audit');
      resolve();
    });
  },
};