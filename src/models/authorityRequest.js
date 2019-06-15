const authorityRequest = function (sequelize, DataTypes) {
    const AuthorityRequest = sequelize.define('authorityRequest', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true
        },
        // The unique secret id used in any emails sent out to verify and fetch the correct authority
        secretID: {
            type: DataTypes.STRING,
            allowNull: false
        },
        // A user id of the user that requested the authority
        // The id of the authority confirmation if it was approved or rejected
        // The authority that was requested
        authorityName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        // The id of the authority, if exists. If this authority was approved then an authorityID must exist. Not vice versa necesarily.
        expirationDate: {
            type: DataTypes.DATE,
            allowNull: false
        },
    }, {
            freezeTableName: true,
        });

    AuthorityRequest.associate = models => {
        AuthorityRequest.belongsTo(models.Authority, { foreignKey: 'authorityID', allowNull: true });
        AuthorityRequest.hasOne(models.AuthorityConfirmation, { foreignKey: 'authorityRequestID', allowNull: true });
        AuthorityRequest.belongsTo(models.User, { foreignKey: 'requesterID', allowNull: false });
    };

    AuthorityRequest.defaultAttributes = ['authorityName', 'id', 'expirationDate', 'authorityID', 'requesterID', 'secretID'];

    return AuthorityRequest;
};

module.exports = authorityRequest;
