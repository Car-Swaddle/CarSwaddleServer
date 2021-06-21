
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`CREATE UNIQUE INDEX uidx_referrer_user_id ON referrer("userID")`);
        // default pay structure
        await queryInterface.sequelize.query(`INSERT INTO "payStructure" ("id", "percentageOfProfit", "maxNumberOfPurchases", "maxNumberOfPurchasesPerUser", "getPaidEvenIfCouponIsApplied", "createdAt", "updatedAt")` +
            ` VALUES ('55a8c070-b600-11eb-b57e-e75f276fa071', 0.05, 1000, 1, TRUE, NOW(), NOW())`);
        return Promise.resolve();
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query("DROP INDEX uidx_referrer_user_id");
        await queryInterface.sequelize.query(`DELETE FROM "payStructure" WHERE "id" = '55a8c070-b600-11eb-b57e-e75f276fa071'`);
        return Promise.resolve()
    },
};