const price = function (sequelize, DataTypes) {
    const Price = sequelize.define('price', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true,
        }
    }, {
        freezeTableNames: true,
    });

    Price.associate = models => {
        Price.belongsTo(models.AutoService, { foreignKey: 'priceID' });
        Price.hasMany(models.PricePart, { foreignKey: 'pricePartID' });
    };

    return Price;
};

module.exports = price;