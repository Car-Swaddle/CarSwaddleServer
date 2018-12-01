const autoService = function (sequelize, DataTypes) {
  const AutoService = sequelize.define('autoService', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      unique: true
    },
    scheduledDate: {
      type: DataTypes.DATE,
    },
    status: {
      type: DataTypes.STRING // ENUM('scheduled', 'inProgress', 'completed', 'canceled'),
    },
    notes: {
      type: DataTypes.STRING,
      allowNull: true
    },
  }, {
    freezeTableName: true,
  });

  AutoService.associate = models => {
    AutoService.belongsTo(models.User, { foreignKey: 'userID' });
    AutoService.belongsTo(models.Mechanic, { foreignKey: 'mechanicID' });
    AutoService.hasOne(models.Location, { foreignKey: 'autoServiceID' });
    AutoService.hasOne(models.Vehicle, { foreignKey: 'autoServiceID' });
    AutoService.hasOne(models.Price, { foreignKey: 'autoServiceID'})
    AutoService.hasMany(models.ServiceEntity, { foreignKey: 'autoServiceID'})
  };
  
  AutoService.STATUS = {
    scheduled: 'scheduled',
    inProgress: 'inProgress',
    completed: 'completed',
    canceled: 'canceled',
  };

  AutoService.allStatus = ['scheduled', 'inProgress', 'completed', 'canceled'];

  AutoService.isValidStatus = function (status) {
    if (AutoService.allStatus.includes(status) == true) {
      return true;
    } else {
      return false;
    }
  };

  return AutoService;
};

module.exports = autoService;
