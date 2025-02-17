const authority = function (sequelize, DataTypes) {
    const Authority = sequelize.define('authority', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true
        },
        authorityName: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
            freezeTableName: true,
        });

    Authority.NAME = {
        readCarSwaddleCoupon: 'readCarSwaddleCoupon',
        editCarSwaddleCoupon: 'editCarSwaddleCoupon',
        readAuthorities: 'readAuthorities',
        editAuthorities: 'editAuthorities',
        readMechanics: 'readMechanics',
        editMechanics: 'editMechanics',
        readReferrers: 'readReferrers',
        editReferrers: 'editReferrers',
    };

    Authority.associate = models => {
        Authority.hasOne(models.AuthorityConfirmation, { foreignKey: 'authorityID', allowNull: false });
        Authority.hasOne(models.AuthorityRequest, { foreignKey: 'authorityID', allowNull: false });
        Authority.belongsTo(models.User, { foreignKey: 'userID', allowNull: false });
    };

    return Authority;
};

module.exports = authority;
