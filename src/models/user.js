var bcrypt = require('bcrypt-nodejs');

const user = function (sequelize, DataTypes) {
    const User = sequelize.define('user', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true
        },
        firstName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        email: {
            type: DataTypes.STRING,
        },
        phoneNumber: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        password: {
            type: DataTypes.STRING,
        }
    },
    {
        freezeTableName: true,
    });

    User.associate = models => {
        User.hasMany(models.AutoService, { foreignKey: 'userID' });
        User.hasOne(models.Mechanic, { foreignKey: 'userID' });
        User.hasMany(models.Vehicle, { foreignKey: 'userID' });
    };

    User.generateHash = function (password) {
        return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
    };

    User.prototype.validPassword = function (password) {
        return bcrypt.compareSync(password, this.password);
    };

    User.prototype.toJSON = function () {
        var values = Object.assign({}, this.get());

        delete values.password;

        if (values.origin != null) {
            values.latitude = values.origin.coordinates[1];
            values.longitude = values.origin.coordinates[0];
        
            // values.mechanicID = values.regionID;

            delete values.origin;
            // delete values.regionID;
            delete values.mechanicID;
            delete values.email;
        }

        return values;
    }

    return User;
};

module.exports = user;


// const User = sequelize.define('user', {
//     firstName: {
//         type: Sequelize.STRING
//     },
//     lastName: {
//         type: Sequelize.STRING
//     }
// });
//
// // force: true will drop the table if it already exists
// User.sync({force: true}).then(() => {
//     // Table created
//     return User.create({
//         firstName: 'John',
//         lastName: 'Hancock'
//     });
// });
