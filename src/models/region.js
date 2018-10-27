const region = function (sequelize, DataTypes) {
    const Region = sequelize.define('region', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true,
        }
    }, {
        freezeTableNames: true,
    });

    Region.associate = models => {
        Region.belongsTo(models.Mechanic, { foreignKey: 'regionID' });
        Region.hasMany(models.PricePart, { foreignKey: 'pricePartID' });
    };

    return Region;
};

module.exports = region;