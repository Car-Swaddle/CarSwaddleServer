const address = function (sequelize, DataTypes) {
    const Address = sequelize.define('address', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true,
        },
        line1: {
            type: DataTypes.STRING,
        },
        postalCode: {
            type: DataTypes.STRING,
        },
        city: {
            type: DataTypes.STRING,
        },
        state: {
            type: DataTypes.STRING,
        },
        country: {
            type: DataTypes.STRING,
        },
    }, {
        freezeTableName: true,
    });

    Address.associate = models => {
        Address.belongsTo(models.Mechanic, { foreignKey: 'mechanicID' });
    };

    return Address;
};

module.exports = address;
