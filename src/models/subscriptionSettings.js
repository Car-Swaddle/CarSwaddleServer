const subscriptionSettings = function (sequelize, DataTypes) {
    const SubscriptionSettings = sequelize.define('subscriptionSettings', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true
        },
        userID: {
            type: DataTypes.STRING,
            allowNull: false
        },
        sendReminderEmails: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        unsubscribeID: {
            type: DataTypes.DATE,
            allowNull: false
        },
    }, {
        freezeTableName: true,
    });

    return SubscriptionSettings;
};

module.exports = subscriptionSettings;