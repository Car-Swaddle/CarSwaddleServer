const pricePart = function (sequelize, DataTypes) {
    const PricePart = sequelize.define('pricePart', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true,
        },
        key: {
            type: DataTypes.STRING,
        },
        value: {
            type: DataTypes.DECIMAL,
        }
    },
    {
        freezeTableNames: true
    });

    PricePart.associate = models => {
        PricePart.belongsTo(models.Price, { foreignKey: 'priceID' });
    };

    return PricePart;
};

module.exports = pricePart;