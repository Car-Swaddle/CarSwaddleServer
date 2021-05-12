const { Util } = require('../util/util');
const uuidV1 = require('uuid/v1');
const models = require('../models');
const { Referrer, PayStructure, sequelize } = models;
const stripeCharges = require('../controllers/stripe-charges.js')(models);
const { QueryTypes } = require('sequelize');

module.exports = class ReferrerController {

    async getReferrer(referrerID) {
        return Referrer.findByPk(referrerID);
    }

    async getReferrers(limit, offset) {
        return Referrer.findAll({
                limit: limit,
                offset: offset,
        });
    }

    async getReferrerSummary(referrerID) {
        const pending = await sequelize.query('SELECT COALESCE(SUM("referrerTransferAmount"), 0) FROM "transactionMetadata" WHERE "referrerID" = ? AND "stripeReferrerTransferID" IS NULL;', {
            replacements: [referrerID],
            type: QueryTypes.SELECT,
            plain: true
        });

        const lifetimeEarnings = await sequelize.query('SELECT COALESCE(SUM("referrerTransferAmount"), 0) FROM "transactionMetadata" WHERE "referrerID" = ? AND "stripeReferrerTransferID" IS NOT NULL;', {
            replacements: [referrerID],
            type: QueryTypes.SELECT,
            plain: true
        });

        return { pending, lifetimeEarnings };
    }

    async getReferrerTransactions(limit, offset) {
        const [results, _] = await sequelize.query('SELECT "createdAt", "referrerTransferAmount" as amount, "stripeReferrerTransferID" as "transferID" FROM "transactionMetadata" WHERE "referrerID" = ? AND "referrerTransferAmount" > 0 LIMIT ? OFFSET ? ORDER BY "createdAt" DESC', {
            replacements: [referrerID, limit, offset],
            type: QueryTypes.SELECT
        });

        return results;
    }

    async executeReferrerPayout(referrerID) {
        await stripeCharges.executeReferrerPayout(referrerID);
    }

    async createReferrer(referrer) {
        // Generate short id designed to be shared
        referrer.id = Util.generateRandomHex(4);
        return Referrer.create(referrer);
    }

    async updateReferrer(referrer) {
        return Referrer.update(referrer, {
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
        payStructure.id = uuidV1();
        return PayStructure.create(payStructure);
    }

    async getPayStructure(payStructureID) {
        return PayStructure.findByPk(payStructureID);
    }

    async getPayStructures() {
        return PayStructure.findAll();
    }

    async updatePayStructure(payStructure) {
        return PayStructure.update(payStructure, {
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
