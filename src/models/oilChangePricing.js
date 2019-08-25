const constants = require('../controllers/constants.js');

const oilChangePricing = function (sequelize, DataTypes) {
    const OilChangePricing = sequelize.define('oilChangePricing', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true,
        },
        conventional: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: constants.DEFAULT_CONVENTIONAL_PRICE
        },
        blend: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: constants.DEFAULT_BLEND_PRICE
        },
        synthetic: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: constants.DEFAULT_SYNTHETIC_PRICE
        },
        highMileage: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: constants.DEFAULT_HIGH_MILEAGE_PRICE
        },
        centsPerMile: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: constants.DEFAULT_CENTS_PER_MILE
        },
    }, {
            freezeTableName: true,
        });

    OilChangePricing.associate = models => {
        OilChangePricing.belongsTo(models.Mechanic, { foreignKey: 'mechanicID' });
    };

    OilChangePricing.fields = {
        conventional: 'conventional',
        blend: 'blend',
        synthetic: 'synthetic',
        highMileage: 'highMileage',
    };

    return OilChangePricing;
};

module.exports = oilChangePricing;