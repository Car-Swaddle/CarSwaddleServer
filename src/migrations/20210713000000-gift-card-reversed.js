
export async function up(queryInterface) {
    return queryInterface.sequelize.query(`ALTER TABLE "transactionGiftCard" ADD COLUMN "reversed" BOOLEAN NOT NULL DEFAULT 'false';`);
}

export async function down(queryInterface) {
    return Promise.resolve()
}
