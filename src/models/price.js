const price = function (sequelize, DataTypes) {
    const Price = sequelize.define('price', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true,
        },
        totalPrice: {
            type: DataTypes.INTEGER,
        }
    }, {
        freezeTableName: true,
    });

    Price.associate = models => {
        Price.belongsTo(models.AutoService, { foreignKey: 'autoServiceID', allowNull: true });
        Price.hasMany(models.PricePart, { foreignKey: 'priceID' });
    };

    return Price;
};

module.exports = price;