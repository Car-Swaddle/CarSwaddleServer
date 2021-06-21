const Database = require("better-sqlite3");
const db = new Database(__dirname + "/../../resources/vehicle-lookup.db", {readonly: true, fileMustExist: true});

class VehicleSpecs {
    id!: number
    year!: number
    make!: string
    model!: string
    engine!: string
    quarts!: number
    oilRating!: string
    viscosity!: string
    viscosityAlt!: string
    filter!: string
}

export class VehicleLookup {

    static listYears(make?: string, model?: string): number[] {
        const prep = this.queryPrep(make, model);
        const stmt = db.prepare("SELECT DISTINCT v.year FROM vehicle v WHERE v.id IN (SELECT docid FROM vehicle_fts " + prep.whereClause + ") ORDER BY v.year DESC");

        return stmt.all(prep.params).map((x: VehicleSpecs) => x.year);
    }

    static listMakes(make?: string, year?: number): string[] {
        const prep = this.queryPrep(make, null, year);
        const stmt = db.prepare("SELECT DISTINCT v.make FROM vehicle v WHERE v.id IN (SELECT docid FROM vehicle_fts " + prep.whereClause + ") ORDER BY v.make");

        return stmt.all(prep.params).map((x: VehicleSpecs) => x.make);
    }

    static listModels(make: string, model?: string, year?: number): string[] {
        const prep = this.queryPrep(make, model, year);
        const stmt = db.prepare("SELECT DISTINCT v.model FROM vehicle v WHERE v.id IN (SELECT docid FROM vehicle_fts " + prep.whereClause + ") ORDER BY v.model");

        return stmt.all(prep.params).map((x: VehicleSpecs) => x.model);
    }

    static listEngines(make: string, model: string, year: number, engine?: string): string[] {
        const prep = this.queryPrep(make, model, year, engine);
        const stmt = db.prepare("SELECT v.engine FROM vehicle v WHERE v.id IN (SELECT docid FROM vehicle_fts " + prep.whereClause + ") ORDER BY v.id");

        return stmt.all(prep.params).map((x: VehicleSpecs) => x.engine);
    }

    static getVehicleSpecs(make: string, model: string, year?: number, engine?: string): VehicleSpecs {
        const prep = this.queryPrep(make, model, year, engine);
        const stmt = db.prepare("SELECT v.* FROM vehicle v WHERE v.id IN (SELECT docid FROM vehicle_fts " + prep.whereClause + ")");

        return stmt.get(prep.params);
    }

    private static queryPrep(make?: string, model?: string | null, year?: number, engine?: string): any {
        var ftsMatchTokens = [];
        if (year) {
            ftsMatchTokens.push("year:" +year)
        }
        if (make) {
            // Match any as prefix or suffix
            // For token queries, values must be lower: https://www.sqlite.org/fts3.html#full_text_index_queries
            ftsMatchTokens.push("make:*" + make.toLowerCase() + "*")
        }
        if (model) {
            ftsMatchTokens.push("model:*" + model.toLowerCase() + "*")
        }
        if (engine) {
            console.log(engine);
            ftsMatchTokens.push("engine:*" + engine.toLowerCase() + "*")
        }
    
        var whereClause = ""
        var params = []
        if (ftsMatchTokens.length > 0) {
            whereClause = " WHERE vehicle_fts MATCH ? "
            params.push(ftsMatchTokens.join(" AND "));
        }
        const prep = {whereClause: whereClause, params: params};
        return prep;
    }

}
