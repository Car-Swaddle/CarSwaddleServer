const authority = function (sequelize, DataTypes) {
    const Authority = sequelize.define('authority', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true
        },
        userID: {
            type: DataTypes.STRING,
            allowNull: false
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

    return Authority;
};

module.exports = authority;
