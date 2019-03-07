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
    })).then(() => queryInterface.createTable('mechanicPayoutDebit', {
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE,
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      payoutID: {
          type: DataTypes.STRING,
          allowNull: false
      },
      mechanicID: {
          type: DataTypes.STRING,
          allowNull: false
      }
    })).then(() => queryInterface.addColumn(
      'mechanicMonthDebit', // name of Source model
      'mechanicID', // name of the key we're adding 
      {
        type: Sequelize.UUID,
        references: {
          model: 'mechanic', // name of Target model
          key: 'id', // key in Target model that we're referencing
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      }
    )).then(() => queryInterface.addColumn(
      'mechanic', // name of Source model
      'mechanicMonthDebitID', // name of the key we're adding 
      {
        type: Sequelize.UUID,
        references: {
          model: 'mechanicMonthDebit', // name of Target model
          key: 'id', // key in Target model that we're referencing
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      }
    )).then(() => queryInterface.addColumn(
      'mechanicPayoutDebit', // name of Source model
      'mechanicID', // name of the key we're adding 
      {
        type: Sequelize.UUID,
        references: {
          model: 'mechanic', // name of Target model
          key: 'id', // key in Target model that we're referencing
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      }
    )).then(() => queryInterface.addColumn(
      'mechanic', // name of Source model
      'mechanicPayoutDebitID', // name of the key we're adding 
      {
        type: Sequelize.UUID,
        references: {
          model: 'mechanicPayoutDebit', // name of Target model
          key: 'id', // key in Target model that we're referencing
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      }
    ));
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
    return queryInterface.removeColumn('User', 'timeZone', Sequelize.STRING)
      .then(() => queryInterface.dropTable('mechanicMonthDebit'))
      .then(() => queryInterface.dropTable('mechanicPayoutDebit'))
      .then(() => {
        // remove Order hasMany Product
        return queryInterface.removeColumn(
          'mechanicMonthDebit', // name of the Target model
          'mechanicID' // key we want to remove
        );
      }).then(() => {
        // remove Order hasMany Product
        return queryInterface.removeColumn(
          'mechanicPayoutDebit', // name of the Target model
          'mechanicID' // key we want to remove
        );
      }).then(() => {
        // remove Order hasMany Product
        return queryInterface.removeColumn(
          'mechanic', // name of the Target model
          'mechanicMonthDebitID' // key we want to remove
        );
      }).then(() => {
        // remove Order hasMany Product
        return queryInterface.removeColumn(
          'mechanic', // name of the Target model
          'mechanicPayoutDebitID' // key we want to remove
        );
      });
  }
};
