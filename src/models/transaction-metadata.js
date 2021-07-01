const transactionMetadata = function (sequelize, DataTypes) {
    const TransactionMetadata = sequelize.define('transactionMetadata', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true
        },
        // Stripe payment intent
        stripePaymentIntentID: {
            type: DataTypes.STRING,
            allowNull: true
        },
        // Legacy stripe balance transaction id
        stripeTransactionID: {
            type: DataTypes.STRING,
            allowNull: true
        },
        // Cost in cents (estimated mechanic cost, not transfer amounts)
        mechanicCost: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        // Amount transferred (or to be transferred) to mechanic
        mechanicTransferAmount: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        // Amount transferred (or to be transferred) to referrer
        referrerTransferAmount: {
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
        giftCardID: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        payStructureID: {
            type: DataTypes.STRING,
            allowNull: true
        },
        stripeMechanicTransferID: {
            type: DataTypes.STRING,
            allowNull: true
        },
        stripeReferrerTransferID: {
            type: DataTypes.STRING,
            allowNull: true
        },
        // Catch-all to store internal event metadata, incoming webhooks timestamps, etc
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

    TransactionMetadata.fetchWithPaymentIntentID = async (stripePaymentIntentID) => {
        if (!stripePaymentIntentID) {
            return Promise.resolve(null);
        }

        return await TransactionMetadata.findOne({
            where: {
                stripePaymentIntentID: stripePaymentIntentID
            }
        });
    };

    return TransactionMetadata;
};


module.exports = transactionMetadata;