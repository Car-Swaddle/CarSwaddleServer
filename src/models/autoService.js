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
      type: DataTypes.ENUM('scheduled', 'inProgress', 'finished', 'canceled'),
    },
    notes: {
      type: DataTypes.STRING,
      allowNull: true
    },
  },
  {
    freezeTableName: true,
  });

  AutoService.associate = models => {
    AutoService.belongsTo(models.User, { foreignKey: 'userID' });
    AutoService.belongsTo(models.Mechanic, { foreignKey: 'mechanicID' });
    AutoService.hasOne(models.Location, { foreignKey: 'autoServiceID' });
    AutoService.hasOne(models.Price, { foreignKey: 'autoServiceID'})
    AutoService.hasMany(models.ServiceEntity, { foreignKey: 'autoServiceID'})
  };
  
  AutoService.STATUS = {
    scheduled: 'scheduled',
    inProgress: 'inProgress',
    finished: 'finished',
    canceld: 'canceled',
  };

  AutoService.isValidStatus = function (status) {
    if (AutoService.Status.scheduled == status ||
    AutoService.Status.inProgress == status ||
    AutoService.Status.finished == status ||
    AutoService.Status.canceled == status) {
      return true;
    } else {
      return false;
    }
  };

  AutoService.TYPE = {
    oilChange: 'oilChange',
  };

  AutoService.isValidType = function (type) {
    if (AutoService.TYPE.oilChange == type) {
      return true;
    } else {
      return false;
    }
  };

  return AutoService;
};

module.exports = autoService;
