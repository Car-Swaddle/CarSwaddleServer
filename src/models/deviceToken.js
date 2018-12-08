const deviceToken = function (sequelize, DataTypes) {
    const DeviceToken = sequelize.define('deviceToken', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true
        },
        token: {
            type: DataTypes.STRING
        }
    }, {
        freezeTableName: true,
    });

    DeviceToken.associate = models => {
        DeviceToken.belongsTo(models.User, { foreignKey: 'userID' });
        DeviceToken.belongsTo(models.Mechanic, { foreignKey: 'mechanicID' });
    };

    return DeviceToken;
};

module.exports = deviceToken;