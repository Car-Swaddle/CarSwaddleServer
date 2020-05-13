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
        conventionalPerQuart: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: constants.DEFAULT_CONVENTIONAL_PRICE_PER_QUART
        },
        blend: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: constants.DEFAULT_BLEND_PRICE
        },
        blendPerQuart: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: constants.DEFAULT_BLEND_PRICE_PER_QUART
        },
        synthetic: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: constants.DEFAULT_SYNTHETIC_PRICE
        },
        syntheticPerQuart: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: constants.DEFAULT_SYNTHETIC_PRICE_PER_QUART
        },
        highMileage: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: constants.DEFAULT_HIGH_MILEAGE_PRICE
        },
        highMileagePerQuart: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: constants.DEFAULT_HIGH_MILEAGE_PRICE_PER_QUART
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

    // TODO - does this need to be updated for per quart
    OilChangePricing.fields = {
        conventional: 'conventional',
        blend: 'blend',
        synthetic: 'synthetic',
        highMileage: 'highMileage',
    };

    return OilChangePricing;
};

module.exports = oilChangePricing;