import { BuildOptions, DataTypes, Model, Sequelize } from "sequelize";

export interface PayStructureAttributes {
    id: string;
    percentageOfProfit: number;
    maxNumberOfPurchases: number;
    maxNumberOfPurchasesPerUser: number;
    getPaidEvenIfCouponIsApplied: boolean;
    referrerID?: string;
}

export interface PayStructureModel extends Model<PayStructureAttributes>, PayStructureAttributes {}

export type PayStructureStatic = typeof Model & {
    new (values?: object, options?: BuildOptions): PayStructureModel;
}

export function PayStructureFactory (sequelize: Sequelize) {
    return <PayStructureStatic> sequelize.define('payStructure', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true
        },
        percentageOfProfit: {
            type: DataTypes.DECIMAL(5,4), // 0.0000
            allowNull: false
        },
        maxNumberOfPurchases: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        maxNumberOfPurchasesPerUser: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1
        },
        getPaidEvenIfCouponIsApplied: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
    });
}
