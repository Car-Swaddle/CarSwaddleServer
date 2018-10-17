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
    },
    {
        freezeTableName: true,
    });

    Vehicle.associate = models => {
        Vehicle.belongsTo(models.User, { foreignKey: 'vehicleID' });
        Vehicle.hasOne(models.VehicleDescription, { foreignKey: 'vehicleDescriptionID'});
    };

    return Vehicle;
};

module.exports = vehicle;