const authoritiesFile = require('./authorities')
const { Util } = require('../util/util');

module.exports = class ReferrerController {
    constructor(models) {
        this.models = models;
        this.authorities = authoritiesFile(models);
    }

    async createReferrer(referrer) {
        return this.models.Referrer.create(referrer);
    }

    async getReferrer(referrerID) {
        return this.models.Referrer.findByPk(referrerID);
    }

    async getReferrers(limit, offset) {
        return this.models.Referrer.findAll({
                limit: limit,
                offset: offset,
        });
    }

    async updateReferrer(referrer) {
        return this.models.Referrer.update(referrer, {
            where: {
                id: referrer.id
            }
        });
    }

    async deleteReferrer(referrerID) {
        const referrer = await this.getReferrer(referrerID);
        return referrer ? referrer.destroy() : Promise.reject();
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
