var apnFramework = require('apn');
var firebaseAdmin = require('firebase-admin');
var dateFormat = require('dateformat');

var carSwaddleProductionOptions = {
    token: {
        key: "src/resources/CarSwaddleAPNSKey.p8",
        keyId: "G665BU53V8",
        teamId: "977533WLK8",
    },
    production: true
}; // Y3N72N8FST

var carSwaddleDebugOptions = {
    token: {
        key: "src/resources/CarSwaddleAPNSKey.p8",
        keyId: "G665BU53V8",
        teamId: "977533WLK8",
    },
    production: false
};


const carSwaddleBundleID = "com.carswaddle.carswaddle";
const carSwaddleMechanicBundleID = "com.carswaddle.carswaddlemechanic";
const APNS_PUSH_TYPE = "APNS";
const FCM_PUSH_TYPE = "FCM";

class PushService {

    constructor() {
        this.carSwaddleProviderProduction = new apnFramework.Provider(carSwaddleProductionOptions);
        this.carSwaddleMechanicProviderProduction = new apnFramework.Provider(carSwaddleProductionOptions);
        this.carSwaddleProviderDebug = new apnFramework.Provider(carSwaddleDebugOptions);
        this.carSwaddleMechanicProviderDebug = new apnFramework.Provider(carSwaddleDebugOptions);
        this.carSwaddleFirebaseAdmin = firebaseAdmin.initializeApp({
            credential: firebaseAdmin.credential.cert("src/resources/CarSwaddleFirebaseKey.json"),
            databaseURL: "https://car-swaddle-56a01.firebaseio.com"
        })
    }

    sendMechanicUserScheduledAppointment(user, mechanic, autoService) {
        const displayName = user.displayName();
        const alert = displayName + ' scheduled an appointment';
        const payload = {
            'type': 'userScheduledAutoService',
            'autoServiceID': autoService.id,
            'userID': user.id
        };
        this.sendMechanicNotification(mechanic, alert, payload, null, null);
    }

    sendUserReminderNotification(autoService) {
        const subject = "Upcoming Oil Change";
        const dateString = dateFormat(autoService.scheduledDate, "dddd, mmmm dS, h:MM TT Z");
        const text = autoService.user.firstName + ', you have an oil change coming up: ' + dateString;
        const payload = {
            'type': 'reminder',
            'date': autoService.scheduledDate,
            'autoServiceID': autoService.id
        };
        this.sendUserNotification(autoService.user, text, payload, null, subject);
    }

    sendMechanicReminderNotification(autoService) {
        const subject = "Upcoming Oil Change";
        const dateString = dateFormat(autoService.scheduledDate, "dddd, mmmm dS, h:MM TT Z");
        const name = autoService.mechanic.user.firstName
        const text = name + ', you have an oil change coming up: ' + dateString;
        const payload = {
            'type': 'reminder',
            'date': autoService.scheduledDate,
            'name': name,
            'autoServiceID': autoService.id
        };
        this.sendMechanicNotification(autoService.mechanic, text, payload, null, subject);
    }

    sendRateMechanicNotificationToUserOf(autoService) {
        const subject = "How would you rate your oil change?";
        const mechanicFirstName = autoService.mechanic.user.firstName;
        const userFirstName = autoService.user.firstName;
        const text = userFirstName + ', give your feedback on your auto service from ' + mechanicFirstName;
        const payload = {
            'type': 'mechanicRating',
            'mechanicID': autoService.mechanic.id,
            'autoServiceID': autoService.id,
            'mechanicFirstName': mechanicFirstName
        };
        this.sendUserNotification(autoService.user, text, payload, null, subject);
    }

    sendUserReviewNotification(user, mechanic, reviewRating) {
        const name = user.displayName();
        var alert = '';
        if (reviewRating > 3) {
            alert = name + ' gave you a ' + reviewRating + '️️⭐ review! Congratulations!';
        } else {
            alert = name + ' gave you a review!';
        }
        const title = 'New review from ' + name;
        const payload = {
            'type': 'userDidRate',
            'userID': user.id,
            'mechanicID': mechanic.id,
            'reviewRating': reviewRating,
        };
        this.sendMechanicNotification(mechanic, alert, payload, null, title);
    }

    sendMechanicUserChangedAutoServiceNotification(user, mechanic, autoService) {
        const alert = user.displayName() + ' changed one of your scheduled auto services.';
        const payload = {
            'type': 'autoServiceUpdated',
            'autoServiceID': autoService.id
        };
        this.sendMechanicNotification(mechanic, alert, payload, null, null);
    }

    sendUserMechanicChangedAutoServiceStatusNotification(user, autoService, status) {
        const mechanicFirstName = autoService.mechanic.user.firstName;
        const title = this.statusNotificationTitle(status, mechanicFirstName);
        const body = this.statusNotificationBody(status, mechanicFirstName);
        const payload = {
            'type': 'autoServiceUpdated',
            'autoServiceID': autoService.id
        };
        this.sendUserNotification(user, body, payload, null, title);
    }

    sendUserMechanicChangedAutoServiceNotification(user, autoService) {
        // const alert = user.displayName() + ' changed one of your scheduled auto services.';
        const mechanicFirstName = autoService.mechanic.user.firstName;
        const alert = user.firstName + ' your mechanic, ' + mechanicFirstName + ', made a change to your oil change.';
        const payload = {
            'type': 'autoServiceUpdated',
            'autoServiceID': autoService.id
        };
        this.sendUserNotification(user, alert, payload, null, null);
    }

    sendUserNotification(user, body, payload, badge, title) {
        return user.getDeviceTokens().then(tokens => {
            tokens.forEach(token => {
                if (token.pushType == APNS_PUSH_TYPE) {
                    let notification = this.createAPNSNotification(body, payload, badge, title);
                    notification.topic = carSwaddleBundleID;
                    this.carSwaddleProviderProduction.send(notification, token.token).then(result => {
                        console.log(JSON.stringify(result, null, 4));
                        console.log("production");
                    });
                    this.carSwaddleProviderDebug.send(notification, token.token).then(result => {
                        console.log(JSON.stringify(result, null, 4));
                        console.log("debug");
                    });
                } else if (token.pushType == FCM_PUSH_TYPE) {
                    this.carSwaddleFirebaseAdmin.messaging().send(this.createFCMNotification(body, payload, title, token.token))
                        .then((response) => {
                            console.info(`Send FCM with response: ${response}`);
                        })
                        .catch((error) => {
                            console.error(`Error sending message for user ${user.id} device token ${token.token} error ${error}`);
                        })
                }
            });
        });
    }


    sendMechanicNotification(mechanic, body, payload, badge, title) {
        return mechanic.getDeviceTokens().then(tokens => {
            tokens.forEach(token => {
                if (token.pushType == APNS_PUSH_TYPE) {
                    var notification = this.createAPNSNotification(body, payload, badge, title);
                    notification.topic = carSwaddleMechanicBundleID;
                    this.carSwaddleMechanicProviderProduction.send(notification, token.token).then(result => {
                        console.log(JSON.stringify(result, null, 4));
                    });
                    this.carSwaddleMechanicProviderDebug.send(notification, token.token).then(result => {
                        console.log(JSON.stringify(result, null, 4));
                    });
                } else if (token.pushType == FCM_PUSH_TYPE) {
                    this.carSwaddleFirebaseAdmin.messaging().send(this.createFCMNotification(body, payload, title, token.token))
                        .then((response) => {
                            console.info(`Send FCM with response: ${response}`);
                        })
                        .catch((error) => {
                            console.error(`Error sending message for user ${mechanic.id} device token ${token.token} error ${error}`);
                        })
                }
            });
        });
    }

    createAPNSNotification(body, payload, badge, title) {
        var notification = new apnFramework.Notification();
        notification.expiry = Math.floor(Date.now() / 1000) + 24 * 3600; // will expire in 24 hours from now
        notification.badge = badge;
        // notification.title = title;
        // notification.body = body;
        notification.sound = "default";
        notification.mutableContent = true;
        notification.alert = { 'title': title, 'body': body };
        // notification.alert.title = payload;
        // notification.alert.body = body;
        // notification.payload = payload;
        notification.payload = payload;
        return notification
    }

    createFCMNotification(body, payload, title, token) {
        // https://firebase.google.com/docs/cloud-messaging/concept-options#notifications_and_data_messages
        return {
            token: token,
            notification: {
                title: title,
                body: body
            },
            data: payload
        }
    }

    statusNotificationTitle(status, mechanicFirstName) {
        switch (status) {
            case 'scheduled':
                return '';
            case 'inProgress':
                return mechanicFirstName + ' started working on your oil change';
            case 'completed':
                return mechanicFirstName + ' has finished your oil change';
            case 'canceled':
                return mechanicFirstName + ' has canceled your oil change';
            default:
                return '';
        }
    }

    statusNotificationBody(status, mechanicFirstName) {
        switch (status) {
            case 'scheduled':
                return '';
            case 'inProgress':
                return mechanicFirstName + ' is ready for you to bring your keys to your vehicle';
            case 'completed':
                return 'Thank you for using Car Swaddle!'; 
            case 'canceled':
                return 'You\'ll receive a refund of your payment within 2 business days';
            default:
                return '';
        }
    }
}

const apn = new PushService();

module.exports = apn;
