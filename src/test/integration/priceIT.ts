
export{}
const assert = require('chai').assert
var request = require('supertest');

var host_url = process.env.HOST_URL;
var jwt = process.env.TEST_JWT;
let host_request = request(host_url);
describe('Price api', function() {

    it('Should have correct price', async done => {
        // TODO - create mechanic
        // const vehicleResp = await host_request.post('/api/vehicle')
        // .send({
        //     vehicleDescription: {
        //         make: "Toyota",
        //         model: "Corolla",
        //         style: '',
        //         trim: "LE",
        //         year: 2018
        //     }
        // })
        // .set("Authorization", `bearer ${jwt}`);

        // await host_request.post('/api/price')
        // .set("Authorization", `bearer ${jwt}`)
        // .send({

        // })
        // const { oilType, mechanicID, coupon, locationID, vehicleID, location: address } = req.body;
        // const { stripeCustomerID } = req.user;

        done()
    });

});