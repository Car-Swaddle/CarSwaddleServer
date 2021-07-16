import { BuildOptions, DataTypes, Model, Sequelize } from "sequelize";

export interface ReferrerAttributes {
    id: string;
    sourceType: string;
    externalID?: string;
    description?: string;
    stripeExpressAccountID?: string;
    vanityID: string;
    activeCouponID?: string;
    activePayStructureID?: string;
    userID: string;
}

export interface ReferrerModel extends Model<ReferrerAttributes>, ReferrerAttributes {}

export type ReferrerStatic = typeof Model & {
    new (values?: object, options?: BuildOptions): ReferrerModel;
}

export function ReferrerFactory(sequelize: Sequelize) {
    return <ReferrerStatic> sequelize.define('referrer', {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            unique: true
        },
        // Pseudo-enum for source: user, email, ad, campaign, etc
        sourceType: {
            type: DataTypes.STRING,
            allowNull: false
        },
        // Internal metadata - id for ad campaign, email template
        externalID: {
            type: DataTypes.STRING,
            allowNull: true
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true
        },
        stripeExpressAccountID: {
            type: DataTypes.STRING,
            allowNull: true
        },
        vanityID: {
            type: DataTypes.STRING,
            allowNull: true
        },
        activeCouponID: {
            type: DataTypes.STRING,
            allowNull: true
        },
        activePayStructureID: {
            type: DataTypes.STRING,
            allowNull: true
        },
    });
};
