const passwordReset = function (sequelize, DataTypes) {
    const PasswordReset = sequelize.define('passwordReset', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true
        },
        token: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false
        },
        expirationDate: {
            type: DataTypes.DATE,
            allowNull: true
        },
    }, {
        freezeTableName: true,
    });

    return PasswordReset;
};

module.exports = passwordReset;