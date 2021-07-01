import { BuildOptions, DataTypes, Model, Sequelize } from "sequelize";

export interface GiftCardAttributes {
    id: string;
    startingBalance: number;
    remainingBalance: number;
    expiration?: Date;
}

export interface GiftCardModel extends Model<GiftCardAttributes>, GiftCardAttributes {}

export type GiftCardStatic = typeof Model & {
    new (values?: object, options?: BuildOptions): GiftCardModel;
}

export function GiftCardFactory(sequelize: Sequelize) {
    return <GiftCardStatic> sequelize.define('referrer', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true
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
    });
};
