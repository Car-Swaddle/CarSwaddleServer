const oilChange = function (sequelize, DataTypes) {
    const OilChange = sequelize.define('oilChange', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true,
        },
        oilType: {
            type: DataTypes.STRING,
        }
    },
        {
            freezeTableName: true,
        });
    
    OilChange.associate = models => {
        OilChange.belongsTo(models.AutoService, { as: 'oilChange' });
    };

    return OilChange;
};

module.exports = oilChange;