const mechanic = function (sequelize, DataTypes) {
    const Mechanic = sequelize.define('mechanic', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: true
        }
    },
    {
        freezeTableName: true,
    });

    Mechanic.associate = models => {
        Mechanic.hasMany(models.AutoService, { foreignKey: {
            name: 'autoServiceID',
            allowNull: true
          }
        });
        Mechanic.hasMany(models.TemplateTimeSpan, { foreignKey: {
            name: 'templateTimeSpanID',
            allowNull: true
          }
        });
        Mechanic.belongsTo(models.User, { 
            foreignKey: {
            name: 'mechanicID',
            allowNull: true
          },
        });
        Mechanic.hasOne(models.Region, { 
            foreignKey: {
            name: 'regionID',
            allowNull: true
          },
        });
    };

    Mechanic.prototype.toJSON = function () {
        var values = Object.assign({}, this.get());

        var latitude = values.region.origin.coordinates[0];
        var longitude = values.region.origin.coordinates[1];
        
        delete values.region.origin;
        delete values.region.regionID;

        values.region.latitude = latitude;
        values.region.longitude = longitude;

        return values;
    }

    return Mechanic;
};

module.exports = mechanic;