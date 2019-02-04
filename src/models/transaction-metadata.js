const transactionMetadata = function (sequelize, DataTypes) {
    const TransactionMetadata = sequelize.define('transactionMetadata', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true
        },
        stripeTransactionID: {
            type: DataTypes.STRING,
            allowNull: true
        },
        // Cost in cents 
        mechanicCost: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        // distance in meters
        drivingDistance: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
    }, {
        freezeTableName: true,
    });

    TransactionMetadata.associate = models => {
        TransactionMetadata.belongsTo(models.AutoService, { foreignKey: 'autoServiceID' });
        TransactionMetadata.belongsTo(models.Mechanic, { foreignKey: 'mechanicID' });
        TransactionMetadata.hasMany(models.TransactionReceipt, { foreignKey: 'transactionMetadataID' });
    };

    return TransactionMetadata;
};


module.exports = transactionMetadata;