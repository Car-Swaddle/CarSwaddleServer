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
        },
        stripeAccountID: {
            type: DataTypes.STRING,
            allowNull: true
        },
        identityDocumentID: {
            type: DataTypes.STRING,
            allowNull: true
        },
        identityDocumentBackID: {
            type: DataTypes.STRING,
            allowNull: true
        },
        dateOfBirth: {
            type: DataTypes.DATE,
            allowNull: true
        },
        profileImageID: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        isAllowed: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        hasSetAvailability: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        hasSetServiceRegion: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    },
        {
            freezeTableName: true,
        });

    Mechanic.associate = models => {
        Mechanic.hasMany(models.AutoService, { foreignKey: { name: 'mechanicID', allowNull: true } });
        Mechanic.hasMany(models.TemplateTimeSpan, { foreignKey: { name: 'mechanicID', allowNull: true } });
        Mechanic.belongsTo(models.User, { foreignKey: { name: 'userID', allowNull: true }, });
        Mechanic.hasOne(models.Region, { foreignKey: { name: 'mechanicID', allowNull: true }, });
        Mechanic.hasOne(models.Address, { foreignKey: { name: 'mechanicID', allowNull: true }, });
        Mechanic.hasMany(models.DeviceToken, { foreignKey: 'mechanicID' });
        Mechanic.hasMany(models.Review, { foreignKey: 'mechanicID' });
        Mechanic.hasMany(models.TransactionMetadata, { foreignKey: 'mechanicID' });
    };

    Mechanic.prototype.toJSON = function () {
        var values = Object.assign({}, this.get());

        return values;
    }

    return Mechanic;
};

module.exports = mechanic;