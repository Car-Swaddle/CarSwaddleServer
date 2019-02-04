const transactionReceipt = function (sequelize, DataTypes) {
    const TransactionReceipt = sequelize.define('transactionReceipt', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true
        },
        receiptPhotoID: {
            type: DataTypes.STRING
        }
    }, {
        freezeTableName: true,
    });

    TransactionReceipt.associate = models => {
        TransactionReceipt.belongsTo(models.TransactionMetadata, { foreignKey: 'transactionMetadataID' });
    };

    return TransactionReceipt;
};

module.exports = transactionReceipt;