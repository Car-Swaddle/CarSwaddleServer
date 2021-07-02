import { BuildOptions, DataTypes, Model, Sequelize } from "sequelize";

export interface GiftCardAttributes {
    id: string;
    code: string;
    startingBalance: number;
    remainingBalance: number;
    expiration?: Date;
    purchaser?: string;
    batchGroup?: string;
}

export interface GiftCardModel extends Model<GiftCardAttributes>, GiftCardAttributes {}

export type GiftCardStatic = typeof Model & {
    new (values?: object, options?: BuildOptions): GiftCardModel;
}

export function GiftCardFactory(sequelize: Sequelize) {
    return <GiftCardStatic> sequelize.define('giftCard', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        code: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
        },
        startingBalance: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        remainingBalance: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        expiration: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        purchaser: {
            type: DataTypes.STRING,
            allowNull: true
        },
        batchGroup: {
            type: DataTypes.STRING,
            allowNull: true
        }
    });
};
