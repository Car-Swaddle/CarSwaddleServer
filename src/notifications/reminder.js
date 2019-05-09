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
        const autoServiceID = autoService.id;
        const models = this.models;

        var self = this;

        var threeDaysBefore = new Date();
        threeDaysBefore.setDate(scheduledDate.getDate() - 3);

        if (threeDaysBefore > new Date()) {
            schedule.scheduleJob(threeDaysBefore, function (time) {
                AutoService.findOne({
                    where: { id: autoServiceID },
                    include: AutoService.includeValues(models),
                }).then(fetchedAutoService => {
                    if (fetchedAutoService.status != 'canceled') {
                        self.mailer.sendUserOilChangeReminderMail(fetchedAutoService);
                        pushNotification.sendUserReminderNotification(fetchedAutoService);
                        pushNotification.sendMechanicReminderNotification(fetchedAutoService);
                    }
                });
            });
        }

        var dayBefore = new Date();
        dayBefore.setDate(scheduledDate.getDate() - 1);

        if (dayBefore > new Date()) {
            schedule.scheduleJob(dayBefore, function (time) {
                AutoService.findOne({
                    where: { id: autoServiceID },
                    include: AutoService.includeValues(models),
                }).then(fetchedAutoService => {
                    if (fetchedAutoService.status != 'canceled') {
                        self.mailer.sendUserOilChangeReminderMail(fetchedAutoService);
                        pushNotification.sendUserReminderNotification(fetchedAutoService);
                        pushNotification.sendMechanicReminderNotification(fetchedAutoService);
                    }
                });
            });
        }

        var thirtyMinutesBefore = this.addMinutes(scheduledDate, -30);

        if (thirtyMinutesBefore > new Date()) {
            const AutoService = this.models.AutoService;
            schedule.scheduleJob(thirtyMinutesBefore, function (time) {
                AutoService.findOne({
                    where: { id: autoServiceID },
                    include: AutoService.includeValues(models),
                }).then(fetchedAutoService => {
                    if (fetchedAutoService.status != AutoService.STATUS.canceled) {
                        self.mailer.sendUserOilChangeReminderMail(fetchedAutoService);
                        pushNotification.sendUserReminderNotification(fetchedAutoService);
                        pushNotification.sendMechanicReminderNotification(fetchedAutoService);
                    }
                });
            });
        }

        // var secondsAfter = this.addSeconds(new Date(), 3);

        // if (secondsAfter > new Date()) {
        //     const AutoService = this.models.AutoService;
        //     schedule.scheduleJob(secondsAfter, function (time) {
        //         AutoService.findOne({
        //             where: { id: autoServiceID },
        //             include: AutoService.includeValues(models),
        //         }).then(fetchedAutoService => {
        //             if (fetchedAutoService.status != AutoService.STATUS.canceled) {
        //                 self.mailer.sendUserOilChangeReminderMail(fetchedAutoService);
        //                 pushNotification.sendUserReminderNotification(fetchedAutoService);
        //                 pushNotification.sendMechanicReminderNotification(fetchedAutoService);
        //             }
        //         });
        //     });
        // }
    }

    addMinutes(date, minutes) {
        return new Date(date.getTime() + minutes * 60000);
    }

    addSeconds(date, seconds) {
        return new Date(date.getTime() + seconds * 1000);
    }

}

module.exports = Reminder;