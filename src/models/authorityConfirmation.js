const authorityConfirmation = function (sequelize, DataTypes) {
    const AuthorityConfirmation = sequelize.define('authorityConfirmation', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true
        },
        // authorityRequestID: {
        //     type: DataTypes.STRING,
        //     allowNull: false
        // },
        status: {
            type: DataTypes.STRING,
            allowNull: false
        },
        // confirmerID: {
        //     type: DataTypes.STRING,
        //     allowNull: false
        // },
        // The id of the authority if it was accepted
        // authorityID: {
        //     type: DataTypes.STRING,
        //     allowNull: true
        // },
    },
        {
            freezeTableName: true,
        });

    AuthorityConfirmation.STATUS = {
        rejected: 'rejected',
        approved: 'approved'
    };

    AuthorityConfirmation.associate = models => {
        AuthorityConfirmation.belongsTo(models.Authority, { foreignKey: 'authorityID', allowNull: true });
        AuthorityConfirmation.belongsTo(models.User, { foreignKey: 'confirmerID', allowNull: false });
        // AuthorityConfirmation.belongsTo(models.AuthorityRequest, { foreignKey: 'authorityRequestID', allowNull: false });
    };

    return AuthorityConfirmation;
};

module.exports = authorityConfirmation;
