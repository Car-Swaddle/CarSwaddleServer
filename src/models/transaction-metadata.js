const transactionMetadata = function (sequelize, DataTypes) {
    const TransactionMetadata = sequelize.define('transactionMetadata', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true
        },
        // Stripe payment intent
        paymentIntentID: {
            type: DataTypes.STRING,
            allowNull: true
        },
        // Legacy stripe transaction id
        stripeTransactionID: {
            type: DataTypes.STRING,
            allowNull: true
        },
        // Cost in cents 
        mechanicCost: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        referrerCost: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        // distance in meters
        drivingDistance: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        referrerID: {
            type: DataTypes.STRING,
            allowNull: true
        },
        couponID: {
            type: DataTypes.STRING,
            allowNull: true
        },
        payStructureID: {
            type: DataTypes.STRING,
            allowNull: true
        },
        // Stripe transfer ids
        mechanicTransferID: {
            type: DataTypes.STRING,
            allowNull: true
        },
        referrerTransferID: {
            type: DataTypes.STRING,
            allowNull: true
        },
        // Catch all to store internal event metadata, other information about transactions
        audit: {
            type: DataTypes.JSON,
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