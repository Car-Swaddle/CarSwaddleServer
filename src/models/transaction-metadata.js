const transactionMetadata = function (sequelize, DataTypes) {
    const TransactionMetadata = sequelize.define('transactionMetadata', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true
        },
        stripeTransactionID: {
            type: DataTypes.STRING
        },
        cost: {
            type: DataTypes.INTEGER
        }
    }, {
        freezeTableName: true,
    });

    // TransactionMetadata.associate = models => {
    //     TransactionMetadata.belongsTo(models.Vehicle, { foreignKey: 'transactionMetadataID' });
    // };

    return TransactionMetadata;
};


module.exports = transactionMetadata;