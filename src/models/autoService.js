const { Op } = require('sequelize');


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
    transferID: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    balanceTransactionID: {
      type: DataTypes.STRING,
      allowNull: true
    },
    transferAmount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    invoiceID: {
      type: DataTypes.STRING,
      allowNull: true
    },
    chargeID: {
      type: DataTypes.STRING,
      allowNull: true
    },
    refundID: {
      type: DataTypes.STRING,
      allowNull: true
    },
    transferReversalID: {
      type: DataTypes.STRING,
      allowNull: true
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
    AutoService.belongsTo(models.Coupon, { foreignKey: 'couponID', allowNull: true });
    AutoService.hasOne(models.Location, { foreignKey: 'autoServiceID' });
    AutoService.hasOne(models.Review, { foreignKey: 'autoServiceIDFromUser', as: 'reviewFromUser' });
    AutoService.hasOne(models.Review, { foreignKey: 'autoServiceIDFromMechanic', as: 'reviewFromMechanic' });
    AutoService.belongsTo(models.Vehicle, { foreignKey: 'vehicleID' });
    AutoService.hasOne(models.Price, { foreignKey: 'autoServiceID' });
    AutoService.hasMany(models.ServiceEntity, { foreignKey: 'autoServiceID' });
    AutoService.hasMany(models.TransactionMetadata, { foreignKey: 'autoServiceID' });
  };

  AutoService.STATUS = {
    scheduled: 'scheduled',
    inProgress: 'inProgress',
    completed: 'completed',
    canceled: 'canceled',
  };

  /// Order of this matters, the client can't change from a later status to an earlier status
  AutoService.allStatus = ['scheduled', 'inProgress', 'completed', 'canceled'];

  AutoService.findByChargeId = function (chargeID) {
    return AutoService.findOne({
      where: { chargeID },
    });
  }

  AutoService.isValidStatus = function (status) {
    if (AutoService.allStatus.includes(status) == true) {
      return true;
    } else {
      return false;
    }
  };

  AutoService.areValidStatuses = function (sortStatus) {
    if (Array.isArray(sortStatus) == false) {
      sortStatus = [sortStatus];
    }
    var difference = AutoService.allStatus.filter(x => !sortStatus.includes(x));
    sortStatus = sortStatus.concat(difference);

    var statusAreValid = true;

    for (var i = 0; i < sortStatus.length; i++) {
      var currentStatus = sortStatus[i];
      if (AutoService.allStatus.includes(currentStatus) == false) {
        statusAreValid = false;
      }
    }
    return statusAreValid;
  }

  AutoService.rawStatusQueryString = function (sortStatus) {
    var sortStatus = sortStatus || AutoService.allStatus;

    if (Array.isArray(sortStatus) == false) {
      sortStatus = [sortStatus];
    }

    var queryString = 'case ';

    var lastIndex = -1;
    for (var i = 0; i < sortStatus.length; i++) {
      queryString += `WHEN status = '` + sortStatus[i] + `' THEN ` + i + ` `;
      lastIndex = i;
    }
    lastIndex += 1;
    queryString += 'ELSE ' + lastIndex + ' END';

    return queryString;
  }

  AutoService.findAllScheduled = function (models, callback) {
    models.AutoService.findAll({
      where: {
        status: AutoService.STATUS.scheduled,
        scheduledDate: {
          [Op.gt]: new Date(),
        }
      },
      include: AutoService.includeValues(models),
    }).then(autoServices => {
      callback(autoServices);
    });
  }

  AutoService.includeValues = function (models) {
    return [
      { model: models.User, attributes: models.User.defaultAttributes, },
      {
        model: models.Mechanic,
        include: [
          {
            model: models.User,
            attributes: models.User.defaultAttributes,
          }
        ],
      },
    ]
  }

  return AutoService;
};

module.exports = autoService;
