module.exports = {
    async up(queryInterface) {
        // percent of profit, not percent of total
        await queryInterface.sequelize.query(`UPDATE "payStructure" SET "percentageOfProfit" = 0.5 WHERE "id" = '55a8c070-b600-11eb-b57e-e75f276fa071'`);
        return Promise.resolve();
    },

    async down(queryInterface) {
        return Promise.resolve()
    },
};