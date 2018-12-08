var apnFramework = require('apn');

var options = {
    token: {
      key: "src/resources/CarSwaddleAPNSKey.p8",
      keyId: "Y3N72N8FST",
      teamId: "MG7WLQ6J4A",
    },
    production: false
};


const carSwaddleBundleID = "CS.CarSwaddle";
const carSwaddleMechanicBundleID = "CS.CarSwaddleMechanic";

class PushService {

    constructor() {
        this.apnProvider = new apnFramework.Provider(options);
    }

    sendNotification(user, alert, payload, badge) {
        return user.getDeviceTokens().then( tokens => {
            tokens.forEach( token => {
                // Prepare the notifications
                let notification = new apnFramework.Notification();
                notification.expiry = Math.floor(Date.now() / 1000) + 24 * 3600; // will expire in 24 hours from now
                notification.badge = badge || 0;
                notification.sound = "default";
                notification.alert = alert;
                // notification.payload = {'messageFrom': 'Solarian Programmer'};
                notification.payload = payload;

                notification.topic = carSwaddleBundleID;
                this.apnProvider.send(notification, token.token).then( result => {
                    console.log(result);
                });
            });
        });
    }

}

const apn = new PushService();

module.exports = apn;
