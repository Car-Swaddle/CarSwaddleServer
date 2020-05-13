import { Util } from "../util/util";
import { VehicleLookup } from "../data/vehicle-lookup";

const uuidV1 = require('uuid/v1');

export class VehicleService {
    private models: any;
    public constructor(models: any) { this.models = models; }

    public async getVehicle(id: string): Promise<any> {
        if (!id) {
            return Promise.reject(new Error("Missing id"));
        }
        // To check - do we need user id to fetch?
        const vehicle = await this.models.Vehicle.findOne({
            where: { id: id },
            include: this.vehicleInclude()
        });
        this.addVehicleSpecs(vehicle);
        return Promise.resolve(vehicle);
    }

    public async listVehiclesForUser(userID: string, limit: number = 100, offset: number = 0): Promise<any[]> {
        if (!userID) {
            return Promise.reject(new Error("Missing user id"));
        }
        const vehicles = await this.models.Vehicle.findAll({
            where: {
              userID: userID
            },
            offset: offset || 0,
            limit: Math.min(limit || 100, 100),
        });
        this.addVehicleSpecs(vehicles);
        return Promise.resolve(vehicles);
    }

    private addVehicleSpecs(...vehicles: any[]) {
        for (let v of vehicles) {
            if (!VehicleService.isValidDescription(v.vehicleDescription)) {
                continue;
            }
            v.specs = VehicleLookup.getVehicleSpecs(v.vehicleDescription.make, v.vehicleDescription.model, v.vehicleDescription.year, v.vehicleDescription.trim);
        }
    }

    public async createVehicle(toCreate, user): Promise<any> {
        if (!VehicleService.isValidVehicle(toCreate)) {
            return Promise.reject(new Error('Must provide one of vin, licensePlate or vehicleDescription.'));
        }

        const vehicleID = uuidV1();
        const vehicle = this.models.Vehicle.build({
            id: vehicleID,
            name: toCreate.name || '',
            vin: toCreate.vin,
            licensePlate: toCreate.licensePlate,
            state: toCreate.state
        });

        vehicle.setUser(user, { save: false });
        await vehicle.save();
        if (toCreate.vehicleDescription) {
            const descriptionJSON = toCreate.vehicleDescription;
            const description = this.buildVehicleDescription(descriptionJSON, vehicleID);
            await description.save();
        }
        return this.getVehicle(vehicleID);
    }

    public async updateVehicle(updated, user): Promise<any> {
        if (!VehicleService.isValidVehicle(updated)) {
            return Promise.reject(new Error('Must provide one of vin, licensePlate or vehicleDescription.'));
        }

        const existing = await this.getVehicle(updated.id);
        if (!existing) {
            return Promise.reject(new Error('Vehicle does not exist'))
        }

        existing.name = updated.name;
        existing.vin = updated.vin;
        existing.licensePlate = updated.licensePlate;
        existing.state = updated.state;

        if (updated.vehicleDescription && existing.vehicleDescription) {
            // Already exists, update
            existing.vehicleDescription.make = updated.vehicleDescription.make;
            existing.vehicleDescription.model = updated.vehicleDescription.model;
            existing.vehicleDescription.style = updated.vehicleDescription.style || '';
            existing.vehicleDescription.trim = updated.vehicleDescription.trim || '';
            existing.vehicleDescription.year = updated.vehicleDescription.year;
        } else if (updated.vehicleDescription && !existing.vehicleDescription) {
            // Added and does not exist, create
            const description = await this.buildVehicleDescription(updated.vehicleDescription, updated.id);
            await description.save();
        } else if (!updated.vehicleDescription && existing.vehicleDescription) {
            // Delete vehicle description, was removed
            await this.models.vehicleDescription.destroy({where: { id: existing.vehicleDescription.id } });
        }

        existing.setUser(user, { save: false })
        await existing.save();
        return this.getVehicle(updated.id);
    }

    private buildVehicleDescription(descriptionJSON, vehicleID): any {
        return this.models.VehicleDescription.build({
            id: uuidV1(),
            make: descriptionJSON.make,
            model: descriptionJSON.model,
            style: descriptionJSON.style || '',
            trim: descriptionJSON.trim || '',
            year: descriptionJSON.year,
            vehicleID: vehicleID
        });
    }

    public static isValidVehicle(v): boolean {
        if (!v) {
            return false;
        }
        const hasVin = Util.isString(v.vin);
        const hasLicensePlate = Util.areStrings(v.licensePlate, v.state);
        const hasDescription = v.vehicleDescription && this.isValidDescription(v.vehicleDescription);
        return hasVin || hasLicensePlate || hasDescription;
    }

    public static isValidDescription(d): boolean {
        return d && Util.areStrings(d.make, d.model) && Util.isNullOrNumber(d.year) && Util.areNullOrStrings(d.style, d.trim);
    }

    private vehicleInclude(): any[] {
        return [
            this.models.VehicleDescription
        ]
    }
}

