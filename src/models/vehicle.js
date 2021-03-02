import { VehicleLookup } from "../data/vehicle-lookup";

export default function(sequelize, DataTypes) {
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
        state: {
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

    Vehicle.prototype.toJSON = function () {
        var values = Object.assign({}, this.get());

        if (values.vehicleDescription && !values.specs) {
            const d = values.vehicleDescription;
            values.specs = VehicleLookup.getVehicleSpecs(d.make, d.model, d.year)
        }

        return values;
    };

    Vehicle.associate = models => {
        Vehicle.belongsTo(models.User, { foreignKey: 'userID', allowNull: false });
        // Vehicle.belongsToMany(models.AutoService, { through: 'VehicleAutoService', foreignKey: 'autoServiceID', allowNull: true});
        Vehicle.hasMany(models.AutoService, { foreignKey: 'vehicleID', allowNull: true });
        Vehicle.hasOne(models.VehicleDescription, { foreignKey: 'vehicleID', allowNull: true});
    };

    return Vehicle;
};
