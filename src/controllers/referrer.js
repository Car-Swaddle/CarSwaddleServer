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
        // Total amount from services that haven't been completed yet
        const pending = await sequelize.query(
            `SELECT COALESCE(SUM(tm."referrerTransferAmount"), 0) as pending ` +
            `FROM "transactionMetadata" tm` +
            `WHERE tm."referrerID" = ? AND tm."stripeReferrerTransferID" IS NULL;`, {
            replacements: [referrerID],
            type: QueryTypes.SELECT,
            plain: true
        });

        // Total amount from transactions already paid
        const lifetimePaid = await sequelize.query(
            `SELECT COALESCE(SUM(tm."referrerTransferAmount"), 0) as lifetime ` +
            `FROM "transactionMetadata" tm ` +
            `WHERE tm."referrerID" = ? AND tm."stripeReferrerTransferID" IS NOT NULL;`, {
            replacements: [referrerID],
            type: QueryTypes.SELECT,
            plain: true
        });

        return { pending: parseInt(pending.pending ?? 0), lifetimePaid: parseInt(lifetimePaid.lifetime ?? 0) };
    }

    /// Relevant referrer transactions for all completed services
    async getReferrerTransactions(referrerID, limit, offset) {
        const results = await sequelize.query(
            `SELECT service."scheduledDate" as date, service.status as status, tm."referrerTransferAmount" as amount, tm."stripeReferrerTransferID" as "transferID" ` +
            `FROM "transactionMetadata" tm INNER JOIN "autoService" service ON tm."autoServiceID" = service.id ` +
            `WHERE tm."referrerID" = ? AND tm."referrerTransferAmount" > 0 ` + 
            `ORDER BY service."scheduledDate" DESC LIMIT ? OFFSET ?`, {
            replacements: [referrerID, limit, offset],
            type: QueryTypes.SELECT
        });

        return results;
    }

    async createReferrer(referrer) {
        // Generate short id designed to be shared
        referrer.id = Util.generateRandomHex(4);
        return await Referrer.create(referrer);
    }

    async createReferrerForUserWithExistingStripeAccount(userID, stripeAccountID) {
        if (!userID || !stripeAccountID) {
            throw "Missing user id or stripe account id"
        }

        const referrerID = Util.generateRandomHex(4);
        const [referrer, created] = await Referrer.findOrCreate({
            where: { userID: userID },
            defaults: { id: referrerID, externalID: `${referrerID}`, sourceType: "USER", userID: userID }
        });

        referrer.stripeExpressAccountID = stripeAccountID;
        await referrer.save();
        return referrer;
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
