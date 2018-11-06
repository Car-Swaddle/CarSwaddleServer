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
        
        return values;
    }

    return Mechanic;
};

module.exports = mechanic;