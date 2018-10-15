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
        Price.belongsTo(models.AutoService, { as: 'autoService' });
        Price.hasMany(models.PricePart, { as: 'priceParts' });
    };

    return Price;
};


module.exports = price;