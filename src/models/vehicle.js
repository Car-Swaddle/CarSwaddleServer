const vehicle = function (sequelize, DataTypes) {
    const Vehicle = sequelize.define('vehicle', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true
        },
        licensePlate: {
            type: DataTypes.STRING,
            allowNull: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        vin: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        freezeTableName: true,
    });

    Vehicle.associate = models => {
        Vehicle.belongsTo(models.User, { foreignKey: 'userID', allowNull: false });
        Vehicle.belongsToMany(models.AutoService, { through: 'VehicleAutoService', foreignKey: 'autoServiceID', allowNull: true});
        Vehicle.hasOne(models.VehicleDescription, { foreignKey: 'vehicleID', allowNull: true});
    };

    return Vehicle;
};

module.exports = vehicle;