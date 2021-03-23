'use strict';
var Sequelize = require('sequelize');

module.exports = {
  async up(queryInterface) {

    let definition = await queryInterface.describeTable('user');
    if (definition.signUpReferrerID) {
        console.warn("Referrer id already exists on user, skipping remaining migration steps");
        return;
    }
    
    const transaction = await queryInterface.sequelize.transaction();

    try {
        await queryInterface.addColumn('user', 'signUpReferrerID', {
            type: Sequelize.STRING,
            allowNull: true,
        }, { transaction });
        await queryInterface.addColumn('user', 'activeReferrerID', {
            type: Sequelize.STRING,
            allowNull: true,
        }, { transaction });

        await queryInterface.addColumn('coupon', 'referrerID', {
            type: Sequelize.STRING,
            allowNull: true,
            references: {
                model: {
                  tableName: 'referrer'
                },
                key: 'id'
            },
        }, { transaction });
        await queryInterface.addColumn('coupon', 'maxRedemptionsPerUser', {
            type: Sequelize.INTEGER,
            allowNull: true,
            default: 1,
        }, { transaction });

        await queryInterface.addColumn('transactionMetadata', 'referrerID', {
            type: Sequelize.STRING,
            allowNull: true,
        }, { transaction });
        await queryInterface.addColumn('transactionMetadata', 'couponID', {
            type: Sequelize.STRING,
            allowNull: true,
        }, { transaction });
        await queryInterface.addColumn('transactionMetadata', 'payStructureID', {
            type: Sequelize.STRING,
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
      await queryInterface.removeColumn('user', 'signUpReferrerID');
      await queryInterface.removeColumn('user', 'activeReferrerID');
      await queryInterface.removeColumn('coupon', 'referrerID');
      await queryInterface.removeColumn('coupon', 'maxRedemptionsPerUser');
      await queryInterface.removeColumn('transactionMetadata', 'referrerID');
      await queryInterface.removeColumn('transactionMetadata', 'couponID');
      await queryInterface.removeColumn('transactionMetadata', 'payStructureID');
      resolve();
    });
  },
};