const { Util } = require('../util/util');
const uuidV1 = require('uuid/v1');
const models = require('../models');
const { Referrer, PayStructure, User, sequelize } = models;
const stripeCharges = require('../controllers/stripe-charges.js')(models);
const { QueryTypes } = require('sequelize');

module.exports = class ReferrerController {

    validVanityIDRegex = /^[!#$&-;=?-\[\]_a-z~]+$/;

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
        if (!referrer.vanityID) {
            referrer.vanityID = referrer.id;
        }
        if (!validVanityIDRegex.match(referrer.vanityID)) {
            throw "Invalid vanity ID" 
        }
        const created = await Referrer.create(referrer);
        await this.createBranchDeepLink(created);
        return created;
    }

    async createReferrerForUserWithExistingStripeAccount(userID, stripeAccountID) {
        if (!userID || !stripeAccountID) {
            throw "Missing user id or stripe account id"
        }

        const referrerID = Util.generateRandomHex(4);
        const [referrer, created] = await Referrer.findOrCreate({
            where: { userID: userID },
            defaults: { id: referrerID, vanityID: referrerID, sourceType: "USER", externalID: userID, userID: userID }
        });

        referrer.stripeExpressAccountID = stripeAccountID;
        await referrer.save();

        await this.createBranchDeepLink(referrer);

        return referrer;
    }

    async updateReferrer(referrer) {
        if (!referrer.vanityID || !validVanityIDRegex.match(referrer.vanityID)) {
            throw "Invalid vanity ID" 
        }

        const existing = await Referrer.findByPk(referrer.id);
        const updated = await Referrer.update(referrer, {
            where: {
                id: referrer.id
            }
        });

        // Update after persist attempt to ensure we check for duplicates
        // Note that we can't delete links in their test environment
        if (referrer.vanityID != existing.vanityID) {
            await this.deleteBranchDeepLink(existing.vanityID);
            await this.createBranchDeepLink(updated);
        }

        return updated;
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

    async createBranchDeepLink(referrer) {
        await axios.post("https://api2.branch.io/v1/url",
            {
                "branch_key": process.env.BRANCH_API_KEY,
                "alias": referrer.vanityID,
                "channel": "affiliate",
                "tags": ["API", "Affiliate"],
                "data": {
                    referrerId: referrer.id
                }
            },
            { headers: {'Content-Type': 'application/json'} }
        );
    }

    async deleteBranchDeepLink(vanityID) {
        return axios.delete(`https://api2.branch.io/v1/url?url=https://go.carswaddle.com/${vanityID}`,
            {
                params: {
                    app_id: process.env.BRANCH_APP_ID
                },
                headers: {
                    'Access-Token': process.env.BRANCH_API_KEY
                }
            }
        );
    }

}
