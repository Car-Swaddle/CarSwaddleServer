
module.exports = {
    async up(queryInterface) {
        const giftCardTableSQL = `
            CREATE TABLE IF NOT EXISTS "giftCard" (
                "id" UUID PRIMARY KEY,
                "code" VARCHAR(50) UNIQUE NOT NULL,
                "startingBalance" INTEGER NOT NULL,
                "remainingBalance" INTEGER NOT NULL,
                "expiration" TIMESTAMP WITH TIME ZONE NULL,
                "purchaser" VARCHAR(255) NULL,
                "batchGroup" VARCHAR(255) NULL,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
            )
        `;

        const giftCardTransactionTableSQL = `
            CREATE TABLE IF NOT EXISTS "transactionGiftCard" (
                "transactionID" VARCHAR(255) NOT NULL REFERENCES "transactionMetadata" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                "giftCardID" UUID NOT NULL REFERENCES "giftCard" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                "amount" INTEGER NOT NULL
            )
        `;

        return Promise.all(queryInterface.sequelize.query(giftCardTableSQL), queryInterface.sequelize.query(giftCardTransactionTableSQL));
    },

    async down() {
        return Promise.resolve();
    },
};