import axios from 'axios';
import { QueryTypes } from 'sequelize';
import * as uuid from 'uuid';
import { Util } from '../util/util';
import { Referrer, PayStructure, User, sequelize } from '../models';
import { ReferrerModel } from '../models/referrer';
import { PayStructureModel } from '../models/payStructure';
const uuidv4 = uuid.v4;

module.exports = class ReferrerController {

    validVanityIDRegex = /^[!#$&-;=?-\[\]_a-z~]+$/;

    async getReferrer(referrerID: string) {
        return await Referrer.findByPk(referrerID);
    }

    async getReferrerForUserID(userID: string) {
        return await Referrer.findOne({
            where: {
                userID: userID
            }
        })
    }

    async getReferrers(limit: number, offset: number) {
        return await Referrer.findAll({
            limit: limit,
            offset: offset,
            include: [{
                model: User
            }]
        });
    }

    async getReferrerSummary(referrerID: string) {
        // Total amount from services that haven't been completed yet
        const pending: {pending: number;}  = await sequelize.query(
            `SELECT COALESCE(SUM(tm."referrerTransferAmount"), 0) as pending ` +
            `FROM "transactionMetadata" tm` +
            `WHERE tm."referrerID" = ? AND tm."stripeReferrerTransferID" IS NULL;`, {
            replacements: [referrerID],
            type: QueryTypes.SELECT,
            plain: true
        });

        // Total amount from transactions already paid
        const lifetimePaid: {lifetime: number;} = await sequelize.query(
            `SELECT COALESCE(SUM(tm."referrerTransferAmount"), 0) as lifetime ` +
            `FROM "transactionMetadata" tm ` +
            `WHERE tm."referrerID" = ? AND tm."stripeReferrerTransferID" IS NOT NULL;`, {
            replacements: [referrerID],
            type: QueryTypes.SELECT,
            plain: true
        });

        return { pending: pending.pending, lifetimePaid: lifetimePaid.lifetime };
    }

    /// Relevant referrer transactions for all completed services
    async getReferrerTransactions(referrerID: string, limit: number, offset: number) {
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

    async createReferrer(referrer: ReferrerModel) {
        // Generate short id designed to be shared
        referrer.id = Util.generateRandomHex(4);
        if (!referrer.vanityID) {
            referrer.vanityID = referrer.id;
        }
        if (!this.validVanityIDRegex.test(referrer.vanityID)) {
            throw "Invalid vanity ID" 
        }
        const created = await Referrer.create(referrer);
        await this.createBranchDeepLink(created);
        return created;
    }

    async createReferrerForUserWithExistingStripeAccount(userID: string, stripeAccountID: string) {
        if (!userID || !stripeAccountID) {
            throw "Missing user id or stripe account id"
        }

        const referrerID = Util.generateRandomHex(4);
        const [referrer, created] = await Referrer.findOrCreate({
            where: { userID: userID },
            defaults: {
                id: referrerID,
                vanityID: referrerID,
                sourceType: "USER",
                externalID: userID,
                userID: userID,
                activePayStructureID: "55a8c070-b600-11eb-b57e-e75f276fa071",
            }
        });

        referrer.stripeExpressAccountID = stripeAccountID;
        await referrer.save();

        await this.createBranchDeepLink(referrer);

        return referrer;
    }

    async updateReferrer(referrer: ReferrerModel) {
        if (!referrer.vanityID || !this.validVanityIDRegex.test(referrer.vanityID)) {
            throw "Invalid vanity ID" 
        }

        const existing = await Referrer.findByPk(referrer.id);
        if (!existing) {
            throw `No referrer exists with id: ${referrer.id}`;
        }

        const [_, allUpdated] = await Referrer.update(referrer, {
            where: {
                id: referrer.id
            }
        });

        if (!allUpdated || allUpdated.length != 1) {
            throw "Invalid referrer update result";
        }
        const updated = allUpdated[0];

        // Update after persist attempt to ensure we check for duplicates
        if (referrer.vanityID != existing.vanityID) {
            await this.deleteBranchDeepLink(existing.vanityID);
            await this.createBranchDeepLink(updated);
        }

        return updated;
    }

    async deleteReferrer(referrerID: string) {
        const referrer = await this.getReferrer(referrerID);
        return referrer ? referrer.destroy() : Promise.reject();
    }

    async createPayStructure(payStructure: PayStructureModel) {
        payStructure.id = uuidv4();
        return await PayStructure.create(payStructure);
    }

    async getPayStructure(payStructureID: string) {
        return await PayStructure.findByPk(payStructureID);
    }

    async getPayStructures() {
        return await PayStructure.findAll();
    }

    async updatePayStructure(payStructure: PayStructureModel) {
        return await PayStructure.update(payStructure, {
            where: {
                id: payStructure.id
            }
        });
    }

    async deletePayStructure(payStructureID: string) {
        const payStructure = await this.getPayStructure(payStructureID);
        return payStructure ? payStructure.destroy() : Promise.reject();
    }

    async createBranchDeepLink(referrer: ReferrerModel) {
        var displayName = `${referrer.sourceType}:${referrer.externalID}`
        if (referrer.userID) {
            const user = await User.findByPk(referrer.userID);
            if (user && user.firstName && user.lastName) {
                displayName = `${user.firstName} ${user.lastName}`;
            }
        }
        return axios.post("https://api2.branch.io/v1/url", {
                "branch_key": process.env.BRANCH_API_KEY,
                "alias": referrer.vanityID,
                "feature": "Affiliate",
                "channel": "Social Media",
                "campaign": referrer.id,
                "tags": ["API", "Affiliate"],
                "type": 2, // This and $marketing_title below must be set or they won't show in the dashboard: https://help.branch.io/faq/docs/links-generated-via-api-are-not-showing-in-the-dashboard
                "data": {
                    "$marketing_title": `Ref: ${displayName}`,
                    referrerId: referrer.id
                }
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    }

    getBranchLinkBase() {
        return process.env.NODE_ENV === "production" ? "go.carswaddle.com/" : "carswaddle.test-app.link/"
    }

    async deleteBranchDeepLink(vanityID: string) {
        return axios.delete(`https://api2.branch.io/v1/url?url=https://${this.getBranchLinkBase()}${vanityID}`,{
            params: {
                app_id: process.env.BRANCH_APP_ID
            },
            headers: {
                'Access-Token': process.env.BRANCH_API_KEY
            }
        });
    }

}
