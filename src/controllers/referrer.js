const { Util } = require('../util/util');
const uuidV1 = require('uuid/v1');
const models = require('../models');
const { Referrer, PayStructure, User, sequelize } = models;
const stripeCharges = require('../controllers/stripe-charges.js')(models);
const { QueryTypes } = require('sequelize');

module.exports = class ReferrerController {

    async getReferrer(referrerID) {
        return await Referrer.findByPk(referrerID);
    }

    async getReferrerForUserID(userID) {
        return await Referrer.findOne({
            where: {
                userID: userID
            }
        })
    }

    async getReferrers(limit, offset) {
        return await Referrer.findAll({
            limit: limit,
            offset: offset,
            include: [{
                model: User
            }]
        });
    }

    async getReferrerSummary(referrerID) {
        const pending = await sequelize.query('SELECT COALESCE(SUM("referrerTransferAmount"), 0) as pending FROM "transactionMetadata" WHERE "referrerID" = ? AND "stripeReferrerTransferID" IS NULL;', {
            replacements: [referrerID],
            type: QueryTypes.SELECT,
            plain: true
        });

        const lifetime = await sequelize.query('SELECT COALESCE(SUM("referrerTransferAmount"), 0) as lifetime FROM "transactionMetadata" WHERE "referrerID" = ?;', {
            replacements: [referrerID],
            type: QueryTypes.SELECT,
            plain: true
        });

        return { pending: parseInt(pending.pending ?? 0), lifetime: parseInt(lifetime.lifetime ?? 0) };
    }

    async getReferrerTransactions(referrerID, limit, offset) {
        const results = await sequelize.query('SELECT "createdAt", "referrerTransferAmount" as amount, "stripeReferrerTransferID" as "transferID" FROM "transactionMetadata" WHERE "referrerID" = ? AND "referrerTransferAmount" > 0 ORDER BY "createdAt" DESC LIMIT ? OFFSET ?', {
            replacements: [referrerID, limit, offset],
            type: QueryTypes.SELECT
        });

        return results;
    }

    async executeReferrerPayout(referrerID) {
        const referrer = this.getReferrer(referrerID);

        if (!referrer || !referrer.stripeExpressAccountID) {
            throw "Not a valid referrer or missing stripe account"
        }

        await stripeCharges.executeReferrerPayout(referrerID);
    }

    async createReferrer(referrer) {
        // Generate short id designed to be shared
        referrer.id = Util.generateRandomHex(4);
        return await Referrer.create(referrer);
    }

    async updateReferrer(referrer) {
        return await Referrer.update(referrer, {
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
        return await PayStructure.create(payStructure);
    }

    async getPayStructure(payStructureID) {
        return await PayStructure.findByPk(payStructureID);
    }

    async getPayStructures() {
        return await PayStructure.findAll();
    }

    async updatePayStructure(payStructure) {
        return await PayStructure.update(payStructure, {
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
