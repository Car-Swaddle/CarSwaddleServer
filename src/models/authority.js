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
        createCarSwaddleCoupon: 'createCarSwaddleCoupon',
        readAuthorities: 'readAuthorities',
        editAuthorities: 'editAuthorities'
    };

    Authority.associate = models => {
        // Authority.hasOne(models.AuthorityConfirmation, { foreignKey: 'authorityID', allowNull: false });
        // Authority.hasOne(models.AuthorityRequest, { foreignKey: 'authorityID', allowNull: false });
        Authority.belongsTo(models.User, { foreignKey: 'userID', allowNull: false });
    };

    return Authority;
};

module.exports = authority;
