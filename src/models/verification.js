
const verification = function (sequelize, DataTypes) {
    const Verification = sequelize.define('verification', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true
        },
        resourceID: {
            type: DataTypes.STRING,
            allowNull: false
        },
        resourceType: {
            type: DataTypes.STRING,
            allowNull: false
        },
        creationDate: {
            type: DataTypes.DATE,
            allowNull: false
        },
    }, {
        freezeTableName: true,
    });

    // Verification.associate = models => {
        // Vehicle.belongsTo(models.User, { foreignKey: 'userID', allowNull: false });
        // // Vehicle.belongsToMany(models.AutoService, { through: 'VehicleAutoService', foreignKey: 'autoServiceID', allowNull: true});
        // Vehicle.hasMany(models.AutoService, { foreignKey: 'vehicleID', allowNull: true });
        // Vehicle.hasOne(models.VehicleDescription, { foreignKey: 'vehicleID', allowNull: true});
    // };

    return Verification;
};

module.exports = verification;