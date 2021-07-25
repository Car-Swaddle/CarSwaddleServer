export{}
import { assert } from 'chai';
import { VehicleLookup } from '../../../data/vehicle-lookup';

describe('Vehicle lookup', function() {
    it('Should have years', function() {
        assert.include(VehicleLookup.listYears(), 2018);
        assert.include(VehicleLookup.listYears('Toyota', 'Corolla'), 2018);
    });

    it('Should have makes', function() {
        assert.include(VehicleLookup.listMakes(), 'Toyota');
        assert.include(VehicleLookup.listMakes('t'), 'Toyota');
        assert.include(VehicleLookup.listMakes(null, 2015), 'Toyota');
        assert.include(VehicleLookup.listMakes('to', 2015), 'Toyota');
    });

    it('Should have models', function() {
        assert.include(VehicleLookup.listModels('toyot', null, 2016), 'Corolla');
        assert.include(VehicleLookup.listModels('toyot', 'c', 2016), 'Corolla');
        assert.include(VehicleLookup.listModels('toyot'), 'Corolla');
        assert.include(VehicleLookup.listModels('toyot', 'corolla'), 'Corolla');
        assert.include(VehicleLookup.listModels('ford', null, 2015), 'F-150');
    });

    it('Should have engines', function() {
        assert.include(VehicleLookup.listEngines('toyota', 'sienna', 2018), 'LE 6-Cyl 3.5 (2GR-FKS) (GAS)');
        assert.notInclude(VehicleLookup.listEngines('toyota', 'corolla', 2018), 'LE 6-Cyl 3.5 (2GR-FKS) (GAS)');
    });

    it('Should have vehicle info', function() {
        const vehicle = VehicleLookup.getVehicleSpecs('toyota', 'sienna', 2018, 'LE 6-Cyl');
        assert.equal(vehicle.year, 2018);
        assert.equal(vehicle.make, 'Toyota');
        assert.equal(vehicle.model, 'Sienna');
        assert.equal(vehicle.engine, 'LE 6-Cyl 3.5 (2GR-FKS) (GAS)');
        assert.equal(vehicle.quarts, 5.8);
    });
});

