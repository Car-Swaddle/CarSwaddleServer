export{}
const assert = require('chai').assert
var request = require('supertest');

var host_url = process.env.HOST_URL;
var jwt = process.env.TEST_JWT;
let host_request = request(host_url);
describe('Vehicle api', function() {

    it('Should create vehicle with description', function() {
        return host_request.post('/api/vehicle')
        .send({
            vehicleDescription: {
                make: "Toyota",
                model: "Corolla",
                style: '',
                trim: "LE",
                year: 2018
            }
        })
        .set("Authorization", "bearer " + jwt)
        .expect(200)
        .then((resp: any) => {
            assert.equal(resp.body.vehicleDescription.make, 'Toyota');
            assert.equal(resp.body.vehicleDescription.model, 'Corolla');
            assert.equal(resp.body.vehicleDescription.trim, 'LE');
            assert.equal(resp.body.vehicleDescription.year, 2018);
            assert.equal(resp.body.specs.quarts, 3.5);
        })
    });

    it('Should create vehicle with license plate', function() {
        return host_request.post('/api/vehicle')
        .send({
            licensePlate: "ABC 123",
            state: "UT"
        })
        .set("Authorization", "bearer " + jwt)
        .expect(200)
        .then((resp: any) => {
            assert.equal(resp.body.licensePlate, 'ABC 123');
            assert.equal(resp.body.state, 'UT');
        })
    });

    it('Should create vehicle with license plate, then update with description', function(done) {
        host_request.post('/api/vehicle')
        .send({
            licensePlate: "ABC 123",
            state: "UT"
        })
        .set("Authorization", "bearer " + jwt)
        .expect(200)
        .then((resp: any) => {
            console.log("NEXT");
            host_request.put('/api/vehicle')
            .send({
                id: resp.body.id,
                vehicleDescription: {
                    make: "Toyota",
                    model: "Prius Prime"
                }
            })
            .expect(200)
            .then((r: any) => {
                assert.isNull(r.body.licensePlate);
                assert.isNull(r.body.state);
                assert.equal(r.body.vehicleDescription.make, 'Toyota');
                assert.equal(r.body.vehicleDescription.model, 'Prius Prime');
                done();
            })
        })
    });
});