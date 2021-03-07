const authoritiesFile = require('./authorities')
const { Util } = require('../util/util');

module.exports = class ReferrerController {
    constructor(models) {
        this.models = models;
        this.authorities = authoritiesFile(models);
    }

    async createPayStructure(payStructure) {
        return this.models.PayStructure.create(payStructure);
    }

    async getPayStructure(payStructureID) {
        return this.models.PayStructure.findByPk(payStructureID);
    }

    async getPayStructures() {
        return this.models.PayStructure.findAll();
    }

    async updatePayStructure(payStructure) {
        return this.models.PayStructure.update(payStructure, {
            where: {
                id: payStructure.id
            }
        });
    }

    async deletePayStructure(payStructureID) {
        const payStructure = await this.getPayStructure(payStructureID);
        return payStructure ? payStructure.destroy() : Promise.reject();
    }

}
