const mechanicPayoutDebit = function (sequelize, DataTypes) {
    const MechanicPayoutDebit = sequelize.define('mechanicPayoutDebit', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true,
        },
        payoutID: {
            type: DataTypes.STRING,
            allowNull: false
        },
        mechanicID: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        freezeTableName: true,
    });

    MechanicPayoutDebit.associate = models => {
        MechanicPayoutDebit.belongsTo(models.Mechanic, { foreignKey: 'mechanicID' });
    };
    return MechanicPayoutDebit;
};

module.exports = mechanicPayoutDebit;