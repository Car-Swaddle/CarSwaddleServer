const schedule = require('node-schedule');
const pushNotification = require('./pushNotifications.js');

class Reminder {

    constructor(models) {
        this.models = models;
        const Email = require('./email.js');
        this.mailer = new Email(models);
    }

    rescheduleRemindersForAllAutoServices() {
        var self = this;
        this.models.AutoService.findAllScheduled(this.models, function (autoServices) {
            for (var i = 0; i < autoServices.length; i++) {
                var autoService = autoServices[i];
                self.scheduleRemindersForAutoService(autoService);
            }
        });
    }

    scheduleRemindersForAutoService(autoService) {
        var scheduledDate = autoService.scheduledDate;

        var self = this;

        var threeDaysBefore = new Date();
        threeDaysBefore.setDate(scheduledDate.getDate() - 3);

        if (threeDaysBefore > new Date()) {
            schedule.scheduleJob(threeDaysBefore, function (huh) {
                // TODO: See if the auto service is still scheduled
                self.mailer.sendUserOilChangeReminderMail(autoService);
                pushNotification.sendUserReminderNotification(autoService);
                // pushNotification.sendMechanicReminderNotification(autoService);
            });
        }

        var dayBefore = new Date();
        dayBefore.setDate(scheduledDate.getDate() - 1);

        if (dayBefore > new Date()) {
            schedule.scheduleJob(dayBefore, function (huh) {
                // TODO: See if the auto service is still scheduled
                self.mailer.sendUserOilChangeReminderMail(autoService);
                pushNotification.sendUserReminderNotification(autoService);
            });
        }

        var thirtyMinutesBefore = this.addMinutes(scheduledDate, -30);

        if (thirtyMinutesBefore > new Date()) {
            schedule.scheduleJob(thirtyMinutesBefore, function (huh) {
                // TODO: See if the auto service is still scheduled
                self.mailer.sendUserOilChangeReminderMail(autoService);
                pushNotification.sendUserReminderNotification(autoService);
                pushNotification.sendMechanicReminderNotification(autoService);
            });
        }

        // schedule.scheduleJob(this.addSeconds(new Date(), 5), function (huh) {
        //     self.mailer.sendUserOilChangeReminderMail(autoService, null);
        //     pushNotification.sendUserReminderNotification(autoService);
        //     pushNotification.sendMechanicReminderNotification(autoService);
        // });

    }

    addMinutes(date, minutes) {
        return new Date(date.getTime() + minutes * 60000);
    }

    addSeconds(date, seconds) {
        return new Date(date.getTime() + seconds * 1000);
    }

}

module.exports = Reminder;